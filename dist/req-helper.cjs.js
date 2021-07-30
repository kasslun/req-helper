/**
 * req-helper
 * v0.0.1-beta.7
 * By kasslun@gmail.com
 * @license MIT License.
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const resolve = Promise.resolve();
let start = 0.1;
const delayIds = {};
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

/**
 * @param fn
 * @param cacheTime
 * @param expirationHandler
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
    const proxy = function () {
        thisArg = thisArg || this;
        if (!cache) {
            cache = fn.call(thisArg);
            cache.catch(expireCb);
            if (cacheTime !== undefined) {
                cache.then(() => {
                    delayId = setDelay(expireCb, cacheTime);
                });
            }
        }
        return cache;
    };
    proxy.refresh = () => {
        cache = undefined;
        clearDelay(delayId);
        return proxy.call(thisArg);
    };
    proxy.expire = () => {
        expireCb();
        clearDelay(delayId);
    };
    return proxy;
};

/**
 * @param fn
 * @param statusChange
 * @param gap
 */
var deResend = (fn, statusChange, gap = 0) => {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'deResend\': parameter 1 is not of type \'Function\'.');
    }
    if (gap !== undefined && (!Number.isInteger(gap) || gap < 0)) {
        throw new TypeError('Failed to execute \'deResend\': parameter 2 is not undefined or a non-negative integer.');
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
function latest (fn, { cacheTime, maxTasks = 4 } = { maxTasks: 4 }) {
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

const validTime = (name, time) => {
    if (time !== undefined && (!Number.isInteger(time) || time < 0)) {
        throw TypeError(`Failed to execute 'packing': property '${name}' of parameter 2 is not a non-negative integer.`);
    }
};
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
    if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
        throw new TypeError('Failed to execute \'packing\': property \'capacity\' of parameter 2 is not a positive integer.');
    }
    validTime('duration', duration);
    validTime('waitTime', waitTime);
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

const notDo = () => { };
/**
 * polling
 * call fn where fn().finally
 * @param fn
 * @param gap
 */
var polling = (fn, gap = 10000) => {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'polling\': parameter 1 is not of type \'Function\'.');
    }
    if (!Number.isInteger(gap) || gap < 1) {
        throw new TypeError('Failed to execute \'polling\': parameter 2 is not a positive integer.');
    }
    let delayId;
    const proxy = () => {
        fn().catch(notDo).then(() => {
            delayId = setDelay(proxy, gap);
        });
    };
    proxy();
    return {
        stop() {
            if (delayId !== undefined) {
                clearDelay(delayId);
                delayId = undefined;
            }
        },
        resume() {
            if (delayId === undefined) {
                proxy();
            }
        },
        refresh(newGap) {
            if (newGap !== undefined) {
                if (!Number.isInteger(newGap) || newGap < 1) {
                    throw new TypeError('Failed to execute \'changeGap\': parameter 1 is not a positive integer.');
                }
                gap = newGap;
            }
            this.stop();
            proxy();
        }
    };
};

exports.cache = cache;
exports.deResend = deResend;
exports.latest = latest;
exports.packing = packing;
exports.polling = polling;
