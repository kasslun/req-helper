import { setDelay, clearDelay } from './lib';
/**
 * @param fn
 * @param cacheTime
 * @param expirationHandler
 */
export default (fn, cacheTime, expirationHandler) => {
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
