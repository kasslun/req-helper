interface IProxy<T, U, V> {
    (this: V, ...arg: U[]): Promise<T>;
    enable: () => void;
}
declare const _default: <T, U, V>(fn: (this: V, ...arg: U[]) => Promise<T>, statusChange?: (this: V, disabled: boolean) => void, gap?: number) => IProxy<T, U, V>;
/**
 * @param fn
 * @param statusChange
 * @param gap
 */
export default _default;
