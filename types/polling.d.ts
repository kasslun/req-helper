interface IController {
    readonly stop: () => void;
    readonly resume: () => void;
    readonly refresh: (newGap?: number) => void;
}
declare const _default: <T>(fn: () => Promise<T>, gap?: number) => IController;
/**
 * Documentation https://kasslun.github.io/req-helper.doc/#polling
 * The polling() controls the polling of ajax/fetch. It needs an argument fn of function type, and fn needs to return a
 * Promise object. When polling() is called, fn is called synchronously. When the Promise object returned by the fn call,
 * it will call the fn again after gap (unit:ms) and loop indefinitely.
 *
 * @param fn. Function, polled function, no parameters. need to return a Promise object.
 * @param gap. Number, optional, polling gap(ms) after Promise fulfilled(or rejected). Expected to be a positive integer, The default value is 10000.
 *
 * @return polling() returns an object controller to control the call of fn.
 * - controller.stop(): Stop fn's call loop.
 * - controller.resume(): If the loop stops, will resume.
 * - controller.refresh([newGap]): Stop fn's call loop and start a new call loop immediately. If the parameter newGap(number)
 * is passed in, the new loop follow the newGap.
 */
export default _default;
