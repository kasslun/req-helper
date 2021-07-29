import { setDelay, clearDelay } from './lib';
const notDo = () => { };
/**
 * polling
 * call fn where fn().finally
 * @param fn
 * @param gap
 */
export default (fn, gap = 10000) => {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'polling\': parameter 1 is not of type \'Function\'.');
    }
    if (!Number.isInteger(gap) || gap < 1) {
        throw new TypeError('Failed to execute \'polling\': parameter 2 is not a positive integer.');
    }
    let delayId;
    const proxy = () => {
        fn().catch(notDo).then(() => {
            delayId = setDelay(proxy, gap);
        });
    };
    proxy();
    return {
        stop() {
            if (delayId !== undefined) {
                clearDelay(delayId);
                delayId = undefined;
            }
        },
        resume() {
            if (delayId === undefined) {
                proxy();
            }
        },
        refresh(newGap) {
            if (newGap !== undefined) {
                if (!Number.isInteger(newGap) || newGap < 1) {
                    throw new TypeError('Failed to execute \'changeGap\': parameter 1 is not a positive integer.');
                }
                gap = newGap;
            }
            this.stop();
            proxy();
        }
    };
};
