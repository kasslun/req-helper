interface ICacheRet<T> {
    (): Promise<T>;
    refresh: () => Promise<T>;
}
declare const _default: <T>(fn: () => Promise<T>, cacheTime?: number, expirationHandler?: () => void) => ICacheRet<T>;
/**
 *
 * @param fn
 * @param cacheTime
 * @param expirationHandler
 */
export default _default;
