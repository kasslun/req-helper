const resolve = Promise.resolve();
let start = 0.1;
const delayIds = {};
/**
 * setTimeout where time > 0
 * Promise.resolve() where time === 0
 * @param fn
 * @param time
 */
export function setDelay(fn, time) {
    if (typeof fn !== 'function') {
        throw new TypeError('Failed to execute \'setDelay\': parameter 1 is not of type \'Function\'.');
    }
    if (time < 0) {
        throw new TypeError('Failed to execute \'setDelay\': parameter 2 is not a non-negative integer.');
    }
    if (time === 0) {
        const delayId = --start + '';
        delayIds[delayId] = true;
        resolve.then(() => {
            if (delayIds[delayId]) {
                delete delayIds[delayId];
                fn();
            }
        });
        return delayId;
    }
    return setTimeout(fn, time);
}
/**
 * clear setDelay
 * @param delayId
 */
export function clearDelay(delayId) {
    switch (typeof delayId) {
        case 'undefined':
            break;
        case 'string':
            delete delayIds[delayId];
            break;
        default:
            clearTimeout(delayId);
    }
}
export function getType(t) {
    return Object.prototype.toString.call(t);
}
export function isPromise(pms) {
    const type = getType(pms);
    return type === '[object Promise]'
        || getType(pms) === '[object Object]'
            && typeof pms.then === 'function'
            && typeof pms.catch === 'function'
            && typeof pms.constructor.resolve === 'function'
            && typeof pms.constructor.reject === 'function';
}
