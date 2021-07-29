interface IProxy<T, U> {
    (this: U): Promise<T>;
    refresh: () => Promise<T>;
    expire: () => void;
}
declare const _default: <T, U>(fn: (this: U) => Promise<T>, cacheTime?: number, expirationHandler?: () => void) => IProxy<T, U>;
/**
 * @param fn
 * @param cacheTime
 * @param expirationHandler
 */
export default _default;
