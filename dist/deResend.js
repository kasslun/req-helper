import { setDelay, clearDelay } from './lib';
/**
 * @param fn
 * @param statusChange
 * @param gap
 */
export default (fn, statusChange, gap = 0) => {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'deResend\': parameter 1 is not of type \'Function\'.');
    }
    if (gap !== undefined && (!Number.isInteger(gap) || gap < 0)) {
        throw new TypeError('Failed to execute \'deResend\': parameter 2 is not undefined or a non-negative integer.');
    }
    let thisArg;
    let disabled = false;
    let delayId;
    const setDisable = statusChange ? (flag) => {
        if (disabled !== flag) {
            disabled = flag;
            statusChange.call(thisArg, disabled);
        }
    } : (flag) => {
        disabled = flag;
    };
    const proxy = function (...arg) {
        thisArg = thisArg || this;
        if (disabled) {
            return Promise.reject(new Error('deResendRet'));
        }
        setDisable(true);
        const pms = fn.call(this, ...arg);
        if (gap !== undefined) {
            pms.then(() => {
                if (disabled) {
                    delayId = setDelay(() => {
                        setDisable(false);
                    }, gap);
                }
            });
            pms.catch(() => { setDisable(false); });
        }
        return pms;
    };
    proxy.enable = () => {
        if (disabled) {
            setDisable(false);
            clearDelay(delayId);
        }
    };
    return proxy;
};
