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
export default function <T, U, V, W = string | number>(fn: (this: U, setAbortHandler: (abortHandler: () => void) => void, cacheKey?: W, ...args: V[]) => Promise<T>, config?: {
    readonly cacheTime?: number;
    readonly maxTasks?: number;
}): (this: U, cacheKey?: W, ...args: V[]) => Promise<T>;
