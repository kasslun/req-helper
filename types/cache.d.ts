interface IProxy<T, U> {
    (this: U, refresh?: boolean): Promise<T>;
    expire: () => void;
}
declare const _default: <T, U>(fn: (this: U) => Promise<T>, cacheTime?: number, expirationHandler?: () => void) => IProxy<T, U>;
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
export default _default;
