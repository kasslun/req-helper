interface IDeResendRet<T, U> {
    (...arg: U[]): Promise<T>;
    enable: () => boolean;
}
declare const _default: <T, U>(fn: (...arg: U[]) => Promise<T>, gap?: number) => IDeResendRet<T, U>;
/**
 * @param fn
 * @param gap
 */
export default _default;
