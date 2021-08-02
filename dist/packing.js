import { clearDelay, setDelay } from './lib';
/**
 * Documentation https://kasslun.github.io/req-helper.doc/#packing
 * The packing() can be used to merge requests, through which you can package (push a single data into an array)
 * a batch of data for batch sending. Used to reduce the number of requests. It supports packaging within a fixed
 * time duration and alive time waitTime, as well as packaging by size capacity.
 *
 * It is mainly used to reduce the number of requests in frequent request scenarios such as system monitoring data reporting and user's behavior data reporting.
 *
 * @param receiver. receiver(packagedData): Function, packagedData(array) receiver. Triggered when the condition of
 * parameter 2 is arbitrarily satisfied and the package is not empty.
 *
 * @param condition. Object, Conditions that trigger packaging. There must be more than 1 of the 3 conditions.
 *
 * - condition.duration: Number, optional. The packaging is triggered again after a fixed time(ms) at the last trigger;
 * value of 0 triggers packaging at the next macro task. This condition takes effect when put() is called again after packaging.
 *
 * - condition.waitTime: Number, optional. Packaging is triggered if it is not put again within a period of time(ms) after
 * the last put; value of 0 triggers packaging at the next macro task. This condition takes effect again each time put() is called.
 *
 * - condition.capacity: Number, optional. Triggered when the number of put reaches or exceeds the capacity. This condition is determined each time put() is called.
 *
 * @return The packing(receiver, condition) Returns a put function to receive data.
 */
export default (receiver, condition) => {
    if (typeof receiver !== 'function') {
        throw new TypeError('Failed to execute \'packing\': parameter 1 is not of type \'Function\'.');
    }
    if (typeof condition !== 'object') {
        throw new TypeError('Failed to execute \'packing\': parameter 2 is not of type \'Object\'.');
    }
    const { duration, waitTime, capacity } = condition;
    if (duration == undefined && waitTime == undefined && capacity == undefined) {
        throw new TypeError('Failed to execute \'packing\': parameter 2 needs to have properties \'duration\', \'capacity\' or \'waitTime\'.');
    }
    validTime('duration', duration);
    validTime('waitTime', waitTime);
    if (capacity != undefined && (!Number.isInteger(capacity) || capacity < 1)) {
        throw new TypeError('Failed to execute \'packing\': property \'capacity\' of parameter 2 is not a positive integer.');
    }
    let isCallPut = false;
    let thisArg;
    let box = [];
    let durationDelayId;
    let waitTimeDelayId;
    const put = function (...arg) {
        isCallPut = true;
        thisArg = thisArg !== null && thisArg !== void 0 ? thisArg : this;
        if (arg.length) {
            box = box.concat(arg);
            // condition.capacity;
            if (capacity && box.length >= capacity) {
                put.pack();
                return;
            }
        }
        // condition.duration
        if (duration != undefined && durationDelayId === undefined) {
            durationDelayId = setDelay(put.pack, duration);
        }
        // condition.waitTime
        if (waitTime != undefined) {
            clearDelay(waitTimeDelayId);
            waitTimeDelayId = setDelay(put.pack, waitTime);
        }
    };
    put.pack = () => {
        if (!isCallPut) {
            return;
        }
        if (durationDelayId !== undefined) {
            clearDelay(durationDelayId);
            durationDelayId = undefined;
        }
        if (waitTimeDelayId !== undefined) {
            clearDelay(waitTimeDelayId);
            waitTimeDelayId = undefined;
        }
        if (!box.length) {
            return;
        }
        const packedBox = box;
        box = [];
        receiver.call(thisArg, packedBox);
    };
    return put;
};
const validTime = (name, time) => {
    if (time != undefined && (!Number.isInteger(time) || time < 0)) {
        throw TypeError(`Failed to execute 'packing': property '${name}' of parameter 2 is not a non-negative integer.`);
    }
};
