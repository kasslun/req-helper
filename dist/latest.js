import cache from './cache';
var PromiseStatus;
(function (PromiseStatus) {
    PromiseStatus[PromiseStatus["Rejected"] = -1] = "Rejected";
    PromiseStatus[PromiseStatus["Pending"] = 0] = "Pending";
    PromiseStatus[PromiseStatus["Fulfilled"] = 1] = "Fulfilled";
})(PromiseStatus || (PromiseStatus = {}));
/**
 * generate a proxy promise
 * @param pms
 */
function generateProxyPromise(pms) {
    const separator = {
        status: PromiseStatus.Pending
    };
    separator.handler = new Promise((resolve, reject) => {
        pms.then((value) => {
            if (separator.status === PromiseStatus.Pending) {
                resolve(value);
                separator.status = PromiseStatus.Fulfilled;
            }
        }).catch(separator.reject = (reason) => {
            if (separator.status === PromiseStatus.Pending) {
                reject(reason);
                separator.status = PromiseStatus.Rejected;
            }
        });
    });
    return separator;
}
/**
 *
 * @param fn
 * @param cacheTime
 * @param maxTasks
 */
export default function (fn, { cacheTime, maxTasks = 4 } = { maxTasks: 4 }) {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'latest\': parameter 1 is not of type \'Function\'.');
    }
    if (cacheTime !== undefined && (!Number.isInteger(cacheTime) || cacheTime < 1)) {
        throw new TypeError('Failed to execute \'latest\': optional property `cacheTime` of parameter 2 not is a positive integer');
    }
    if (!Number.isInteger(maxTasks) || maxTasks < 1) {
        throw new TypeError('Failed to execute \'latest\': optional property `maxTasks` of parameter 2 not is a positive integer');
    }
    let thisArg;
    const caches = new Map();
    let proxyPromise;
    let waiting;
    let userTaskSize = 0;
    const abortHandlerList = [];
    return function proxy(cacheKey, ...args) {
        thisArg = thisArg || this;
        const conditionType = typeof cacheKey;
        const allowCaching = cacheTime !== undefined && (conditionType === 'string' || conditionType === 'number' && Number.isNaN(cacheKey));
        // Hit cache
        if (allowCaching && caches.has(cacheKey)) {
            return caches.get(cacheKey)();
        }
        // reject prev proxy, keep user data latest
        if (proxyPromise && proxyPromise.status === PromiseStatus.Pending) {
            proxyPromise.reject(new Error('The latest aborted!'));
        }
        // max tasks limit, such as http request limit;
        if (userTaskSize >= maxTasks) {
            if (abortHandlerList[0]) {
                abortHandlerList[0]();
                abortHandlerList.shift();
            }
            // return pending;
            return new Promise((resolve, reject) => {
                if (waiting) {
                    waiting.reject('The latest aborted!');
                }
                waiting = { resolve, reject, cacheKey, args };
            });
        }
        // bound user fn
        let abortHandler;
        const setAbortHandler = (handler) => {
            if (typeof handler !== 'function') {
                throw new TypeError('Failed to execute \'setAbortHandler\': parameter 1 is not of type \'Function\'.');
            }
            abortHandler = handler;
            abortHandlerList.push(handler);
        };
        let boundFn = () => fn.call(thisArg, setAbortHandler, cacheKey, ...args);
        // cache fn
        if (allowCaching) {
            boundFn = cache(boundFn, cacheTime, () => {
                caches.delete(cacheKey);
            });
            caches.set(cacheKey, boundFn);
        }
        userTaskSize++;
        const userTask = boundFn();
        proxyPromise = generateProxyPromise(userTask);
        userTask.catch(() => { }).then(() => {
            userTaskSize--;
            if (waiting) {
                waiting.resolve(proxy.call(thisArg, waiting.cacheKey, ...waiting.args));
                waiting = undefined;
            }
            if (abortHandler) {
                const index = abortHandlerList.indexOf(abortHandler);
                if (index !== -1) {
                    abortHandler.call(thisArg);
                    abortHandlerList.splice(index, 1);
                }
            }
        });
        return proxyPromise.handler;
    };
}
