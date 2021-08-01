import { setDelay, clearDelay, isPromise } from './lib';
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
