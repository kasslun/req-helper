interface IProxy<T, U, V> {
    (this: V, ...arg: U[]): Promise<T>;
    enable: () => void;
}
declare const _default: <T, U, V>(fn: (this: V, ...arg: U[]) => Promise<T>, statusChange?: (this: V, disabled: boolean) => void, gap?: number) => IProxy<T, U, V>;
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
export default _default;
