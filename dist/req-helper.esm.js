/**
 * req-helper
 * v0.0.2
 * By kasslun@gmail.com
 * @license MIT License.
 */

const resolve = Promise.resolve();
let start = 0.1;
const delayIds = {};
/**
 * setTimeout where time > 0
 * Promise.resolve() where time === 0
 * @param fn
 * @param time
 */
function setDelay(fn, time) {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'setDelay\': parameter 1 is not of type \'Function\'.');
    }
    if (time < 0) {
        throw new TypeError('Failed to execute \'setDelay\': parameter 2 is not a non-negative integer.');
    }
    if (time === 0) {
        const delayId = --start + '';
        delayIds[delayId] = true;
        resolve.then(() => {
            if (delayIds[delayId]) {
                delete delayIds[delayId];
                fn();
            }
        });
        return delayId;
    }
    return setTimeout(fn, time);
}
/**
 * clear setDelay
 * @param delayId
 */
function clearDelay(delayId) {
    switch (typeof delayId) {
        case 'undefined':
            break;
        case 'string':
            delete delayIds[delayId];
            break;
        default:
            clearTimeout(delayId);
    }
}
function getType(t) {
    return Object.prototype.toString.call(t);
}
function isPromise(pms) {
    const type = getType(pms);
    return type === '[object Promise]'
        || getType(pms) === '[object Object]'
            && typeof pms.then === 'function'
            && typeof pms.catch === 'function'
            && typeof pms.constructor.resolve === 'function'
            && typeof pms.constructor.reject === 'function';
}

/**
 * Documentation https://kasslun.github.io/req-helper.doc/#cache
 * The cache() can remember the result of Promise pending or fulfilled for a period of time and return the result
 * directly in the next call, which is very useful when an ajax/fetch request is triggered frequently in a short time.
 * It needs a function fn that returns Promise object as a parameter, it returns a proxy function. This proxy function
 * call can cache the results of Promise pending or fulfilled.
 *
 * import { cache } from 'req-helper'
 * const proxyFn = cache(() => fetch(url), 1000)
 * // The promise returned by fn is cached for 1 second.
 * proxyFn().then(response => {
 * // do something
* }).catch(() => {
*  // do other thing
* })
 * @param fn. Function, called function, no parameters. need to return a Promise object.
 * @param cacheTime. Number, optional, cache time(ms). Expected to be a non-negative integer, The default(undefined)
 * permanently valid in memory; value of 0 is valid until the next macro task.
 * @param expirationHandler. Called when the cache expires.
 * @return cache(fn) returns a proxy function of the fn.
 */
var cache = (fn, cacheTime, expirationHandler) => {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'cache\': parameter 1 is not of type \'Function\'.');
    }
    if (cacheTime !== undefined && (!Number.isInteger(cacheTime) || cacheTime < 0)) {
        throw new TypeError('Failed to execute \'cache\': parameter 2 is not undefined or a non-negative integer.');
    }
    if (expirationHandler !== undefined && typeof expirationHandler !== 'function') {
        throw new TypeError('Failed to execute \'cache\' : optional parameter 3 is not undefined or of type \'Function\'.');
    }
    let thisArg;
    let delayId;
    let cache;
    const expireCb = expirationHandler ? () => {
        if (cache) {
            cache = undefined;
            expirationHandler && expirationHandler.call(thisArg);
        }
    } : () => { cache = undefined; };
    const proxy = function (refresh = false) {
        thisArg = thisArg || this;
        if (refresh) {
            expireCb();
        }
        if (!cache) {
            cache = fn.call(thisArg);
            if (!isPromise(cache)) {
                throw new TypeError('Failed to execute \'proxy\' in \'cache\' : the return value of the parameter 1 of \'cache\' call is not of type \'Promise\'.');
            }
            cache.catch(expireCb);
            if (cacheTime !== undefined) {
                delayId = setDelay(expireCb, cacheTime);
            }
        }
        return cache;
    };
    proxy.expire = () => {
        expireCb();
        clearDelay(delayId);
    };
    return proxy;
};

/**
 * Documentation https://kasslun.github.io/req-helper.doc/#deResend
 *
 * The deResend() can be used to prevent repeated requests from ajax/fetch, such as repeated submission of forms, frequent state switching, etc.
 * It needs a function fn that returns Promise object as a parameter, it return a proxy function. This proxy function
 * can control the call frequency of fn. fn is disabled(cannot call), until Promise object returned by fn() is fulfilled (or rejected).
 *
 * import { deResend } from 'req-helper';
 * const proxyFn = deResend((arg) => {
 *   return fetch(url).then(response => {
 *     // do something
 *   })
 * });
 * // call the proxy function of fn
 * proxyFn(arg)
 *
 * @param fn. Function, called function. need to return a promise object.
 *
 * @param statusChange. Function, optional, fn disable status change callback. We can use this callback function to
 * control the disabled attribute of the button or add loading to the page.
 *
 * @param gap. Number, optional, disable gap(ms) after promise fulfilled(or rejected). Expected to be a non-negative integer,
 * The default(undefined) permanently disabled; value of 0 means that you disable to the next macro task.
 *
 * @return deResend(fn) returns a proxy function proxyFn of the fn, the proxy receives any parameters and finally passes in fn
 */
var deResend = (fn, statusChange, gap = 0) => {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'deResend\': parameter 1 is not of type \'Function\'.');
    }
    if (statusChange !== undefined && typeof statusChange !== 'function') {
        throw new TypeError('Failed to execute \'deResend\': optional parameter 2 is not of type \'Function\'.');
    }
    if (gap !== undefined && (!Number.isInteger(gap) || gap < 0)) {
        throw new TypeError('Failed to execute \'deResend\': parameter 3 is not undefined or a non-negative integer.');
    }
    let thisArg;
    let disabled = false;
    let delayId;
    const setDisable = statusChange ? (flag) => {
        if (disabled !== flag) {
            disabled = flag;
            statusChange.call(thisArg, disabled);
        }
    } : (flag) => {
        disabled = flag;
    };
    const proxy = function (...arg) {
        thisArg = thisArg || this;
        if (disabled) {
            return Promise.reject(new Error('deResendRet'));
        }
        setDisable(true);
        const pms = fn.call(this, ...arg);
        if (!isPromise(pms)) {
            throw new TypeError('Failed to execute \'proxy\' in \'deResend\' : the return value of the parameter 1 of \'cache\' call is not of type \'Promise\'.');
        }
        if (gap !== undefined) {
            pms.then(() => {
                if (disabled) {
                    delayId = setDelay(() => {
                        setDisable(false);
                    }, gap);
                }
            });
            pms.catch(() => { setDisable(false); });
        }
        return pms;
    };
    proxy.enable = () => {
        if (disabled) {
            setDisable(false);
            clearDelay(delayId);
        }
    };
    return proxy;
};

var PromiseStatus;
(function (PromiseStatus) {
    PromiseStatus[PromiseStatus["Rejected"] = -1] = "Rejected";
    PromiseStatus[PromiseStatus["Pending"] = 0] = "Pending";
    PromiseStatus[PromiseStatus["Fulfilled"] = 1] = "Fulfilled";
})(PromiseStatus || (PromiseStatus = {}));
/**
 * Documentation https://kasslun.github.io/req-helper.doc/#latest
 * The latest() used to frequently request a resource through different query terms in a short time (for example,
 * more than one second). For example, <input> query input suggestions during fast input.
 * It can limit the number of concurrent requests through parameters to prevent browser requests from queuing (see browser concurrency).
 * It can also temporarily cache the response of the request through query criteria (which need to be string or number).
 * The latest() needs a function that returns Promise object as parameter fn, and returns a proxy function proxyFn
 * to control the call and arguments of fn.
 *
 * @param fn .fn(setAbortHandler, cacheKey [, ...arg]): Function, Send request and return Promise object. It receives
 * the parameters passed by proxyFn starting with parameter 2 (See Returns part).
 *
 * - setAbortHandler(abortHandler): Function, parameters 1 of fn, We need to set an abort function abortHandler to abort
 * the ajax/fetch request so that the Promise returned by fn changes from pending to rejected. (Fetch abort see AbortController)
 *
 * - cacheKey: Any type. If the type is String or Number(not NaN) , the fulfilled Promise returned by fn will be cached through dictionary key cacheKey, and the cache time is set through config.cacheTime. If you need no cache.
 *
 * @param config Object, optional, default { maxTasks: 4 }
 * - config.cacheTime: Number, optional, positive integer, default undefined is no cache. Cache time(ms) of results
 * corresponding to dictionary key cacheKey.
 * - config.maxTasks: Number, optional, positive integer, default 4. Maximum number of concurrent request.
 *
 * @return latest() returns a proxy function proxyFn of the fn, the proxy function receives any parameters and finally passes in fn.
 */
function latest (fn, config = { maxTasks: 4 }) {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'latest\': parameter 1 is not of type \'Function\'.');
    }
    if (typeof config !== 'object') {
        throw new TypeError('Failed to execute \'latest\': optional parameter 2 is not of type \'Object\'.');
    }
    const { cacheTime, maxTasks = 4 } = config;
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
        if (!isPromise(userTask)) {
            throw new TypeError('Failed to execute \'proxy\' in \'latest\' : the return value of the parameter 1 of \'cache\' call is not of type \'Promise\'.');
        }
        proxyPromise = generateProxyPromise(userTask);
        userTask.catch(() => { }).then(() => {
            userTaskSize--;
            if (abortHandler) {
                const index = abortHandlerList.indexOf(abortHandler);
                if (index !== -1) {
                    abortHandlerList.splice(index, 1);
                }
            }
            if (waiting) {
                waiting.resolve(proxy.call(thisArg, waiting.cacheKey, ...waiting.args));
                waiting = undefined;
            }
        });
        return proxyPromise.handler;
    };
}
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
 * Documentation https://kasslun.github.io/req-helper.doc/#packing
 * The packing() can be used to merge requests, through which you can package (push a single data into an array)
 * a batch of data for batch sending. Used to reduce the number of requests. It supports packaging within a fixed
 * time duration and alive time waitTime, as well as packaging by size capacity.
 *
 * It is mainly used to reduce the number of requests in frequent request scenarios such as system monitoring data reporting and user's behavior data reporting.
 *
 * @param receiver. receiver(packagedData): Function, packagedData(array) receiver. Triggered when the condition of
 * parameter 2 is arbitrarily satisfied and the package is not empty.
 *
 * @param condition. Object, Conditions that trigger packaging. There must be more than 1 of the 3 conditions.
 *
 * - condition.duration: Number, optional. The packaging is triggered again after a fixed time(ms) at the last trigger;
 * value of 0 triggers packaging at the next macro task. This condition takes effect when put() is called again after packaging.
 *
 * - condition.waitTime: Number, optional. Packaging is triggered if it is not put again within a period of time(ms) after
 * the last put; value of 0 triggers packaging at the next macro task. This condition takes effect again each time put() is called.
 *
 * - condition.capacity: Number, optional. Triggered when the number of put reaches or exceeds the capacity. This condition is determined each time put() is called.
 *
 * @return The packing(receiver, condition) Returns a put function to receive data.
 */
var packing = (receiver, condition) => {
    if (typeof receiver !== 'function') {
        throw new TypeError('Failed to execute \'packing\': parameter 1 is not of type \'Function\'.');
    }
    if (typeof condition !== 'object') {
        throw new TypeError('Failed to execute \'packing\': parameter 2 is not of type \'Object\'.');
    }
    const { duration, waitTime, capacity } = condition;
    if (duration === undefined && waitTime === undefined && capacity === undefined) {
        throw new TypeError('Failed to execute \'packing\': parameter 2 needs to have properties \'duration\', \'capacity\' or \'waitTime\'.');
    }
    validTime('duration', duration);
    validTime('waitTime', waitTime);
    if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
        throw new TypeError('Failed to execute \'packing\': property \'capacity\' of parameter 2 is not a positive integer.');
    }
    let isCallPut = false;
    let thisArg;
    let box = [];
    let durationDelayId;
    let waitTimeDelayId;
    const assembler = function (...arg) {
        isCallPut = true;
        thisArg = thisArg || this;
        if (arg.length) {
            box = box.concat(arg);
            // condition.capacity;
            const length = box.length;
            if (capacity && length >= capacity) {
                assembler.pack();
                return;
            }
        }
        // condition.duration
        if (duration !== undefined && durationDelayId === undefined) {
            durationDelayId = setDelay(assembler.pack, duration);
        }
        // condition.waitTime
        if (waitTime !== undefined) {
            if (waitTimeDelayId !== undefined) {
                clearDelay(waitTimeDelayId);
            }
            waitTimeDelayId = setDelay(assembler.pack, waitTime);
        }
    };
    assembler.pack = () => {
        if (!isCallPut) {
            return;
        }
        if (durationDelayId !== undefined) {
            clearDelay(durationDelayId);
            durationDelayId = undefined;
        }
        if (waitTimeDelayId !== undefined) {
            clearDelay(waitTimeDelayId);
            waitTimeDelayId = undefined;
        }
        if (!box.length) {
            return;
        }
        const packedBox = box;
        box = [];
        receiver.call(thisArg, packedBox);
    };
    return assembler;
};
const validTime = (name, time) => {
    if (time !== undefined && (!Number.isInteger(time) || time < 0)) {
        throw TypeError(`Failed to execute 'packing': property '${name}' of parameter 2 is not a non-negative integer.`);
    }
};

var PollingAction;
(function (PollingAction) {
    PollingAction[PollingAction["Init"] = 0] = "Init";
    PollingAction[PollingAction["UserTask"] = 1] = "UserTask";
    PollingAction[PollingAction["Timer"] = 2] = "Timer";
    PollingAction[PollingAction["WillStop"] = 3] = "WillStop";
})(PollingAction || (PollingAction = {}));
/**
 * Documentation https://kasslun.github.io/req-helper.doc/#polling
 * The polling() controls the polling of ajax/fetch. It needs an argument fn of function type, and fn needs to return a
 * Promise object. When polling() is called, fn is called synchronously. When the Promise object returned by the fn call,
 * it will call the fn again after gap (unit:ms) and loop indefinitely.
 *
 * @param fn. Function, polled function, no parameters. need to return a Promise object.
 * @param gap. Number, optional, polling gap(ms) after Promise fulfilled(or rejected). Expected to be a positive integer, The default value is 10000.
 *
 * @return polling() returns an object controller to control the call of fn.
 * - controller.stop(): Stop fn's call loop.
 * - controller.resume(): If the loop stops, will resume.
 * - controller.refresh([newGap]): Stop fn's call loop and start a new call loop immediately. If the parameter newGap(number)
 * is passed in, the new loop follow the newGap.
 */
var polling = (fn, gap = 10000) => {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'polling\': parameter 1 is not of type \'Function\'.');
    }
    if (!Number.isInteger(gap) || gap < 1) {
        throw new TypeError('Failed to execute \'polling\': parameter 2 is not a positive integer.');
    }
    let delayId;
    let status = PollingAction.Init;
    const proxy = () => {
        status = PollingAction.UserTask;
        const userTask = fn();
        if (!isPromise(userTask)) {
            status = PollingAction.Init;
            throw new TypeError('Failed to execute \'proxy\' in \'polling\' : the return value of the parameter 1 of \'cache\' call is not of type \'Promise\'.');
        }
        userTask.catch(noop).then(() => {
            if (status === PollingAction.UserTask) {
                status = PollingAction.Timer;
                delayId = setDelay(proxy, gap);
            }
            else {
                status = PollingAction.Init;
            }
        });
    };
    proxy();
    return {
        stop() {
            if (status === PollingAction.Timer) {
                clearDelay(delayId);
                status = PollingAction.Init;
            }
            else if (status === PollingAction.UserTask) {
                status = PollingAction.WillStop;
            }
        },
        resume() {
            if (status === PollingAction.Init) {
                proxy();
            }
            else if (status === PollingAction.WillStop) {
                status = PollingAction.UserTask;
            }
        },
        refresh(newGap) {
            if (newGap !== undefined) {
                if (!Number.isInteger(newGap) || newGap < 1) {
                    throw new TypeError('Failed to execute \'changeGap\': parameter 1 is not a positive integer.');
                }
                gap = newGap;
            }
            switch (status) {
                case PollingAction.Timer:
                    clearDelay(delayId);
                    status = PollingAction.Init;
                    proxy();
                    break;
                case PollingAction.WillStop:
                    status = PollingAction.UserTask;
                    break;
                case PollingAction.Init:
                    proxy();
                    break;
            }
        }
    };
};
const noop = () => { };

export { cache, deResend, latest, packing, polling };
