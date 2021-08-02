import { setDelay, clearDelay, isPromise } from './lib';
var PollingAction;
(function (PollingAction) {
    PollingAction[PollingAction["Init"] = 0] = "Init";
    PollingAction[PollingAction["UserTask"] = 1] = "UserTask";
    PollingAction[PollingAction["Timer"] = 2] = "Timer";
    PollingAction[PollingAction["WillStop"] = 3] = "WillStop";
})(PollingAction || (PollingAction = {}));
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
export default (fn, gap = 10000) => {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'polling\': parameter 1 is not of type \'Function\'.');
    }
    if (gap != undefined && !Number.isInteger(gap) || gap < 1) {
        throw new TypeError('Failed to execute \'polling\': parameter 2 is not a positive integer.');
    }
    let delayId;
    let status = PollingAction.Init;
    const proxy = () => {
        status = PollingAction.UserTask;
        const userTask = fn();
        if (!isPromise(userTask)) {
            status = PollingAction.Init;
            throw new TypeError('Failed to execute \'proxy\' in \'polling\' : the return value of the parameter 1 of \'cache\' call is not of type \'Promise\'.');
        }
        userTask.catch(noop).then(() => {
            if (status === PollingAction.UserTask) {
                status = PollingAction.Timer;
                delayId = setDelay(proxy, gap);
            }
            else {
                status = PollingAction.Init;
            }
        });
    };
    proxy();
    return {
        stop() {
            if (status === PollingAction.Timer) {
                clearDelay(delayId);
                status = PollingAction.Init;
            }
            else if (status === PollingAction.UserTask) {
                status = PollingAction.WillStop;
            }
        },
        resume() {
            if (status === PollingAction.Init) {
                proxy();
            }
            else if (status === PollingAction.WillStop) {
                status = PollingAction.UserTask;
            }
        },
        refresh(newGap) {
            if (newGap != undefined) {
                if (!Number.isInteger(newGap) || newGap < 1) {
                    throw new TypeError('Failed to execute \'changeGap\': parameter 1 is not a positive integer.');
                }
                gap = newGap;
            }
            switch (status) {
                case PollingAction.Timer:
                    clearDelay(delayId);
                    status = PollingAction.Init;
                    proxy();
                    break;
                case PollingAction.WillStop:
                    status = PollingAction.UserTask;
                    break;
                case PollingAction.Init:
                    proxy();
                    break;
            }
        }
    };
};
const noop = () => { };
