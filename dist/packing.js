import { clearDelay, setDelay } from './lib';
const validTime = (name, time) => {
    if (time !== undefined && (!Number.isInteger(time) || time < 0)) {
        throw TypeError(`Failed to execute 'packing': property '${name}' of parameter 2 is not a non-negative integer.`);
    }
};
export default (receiver, condition) => {
    if (typeof receiver !== 'function') {
        throw new TypeError('Failed to execute \'packing\': parameter 1 is not of type \'Function\'.');
    }
    if (typeof condition !== 'object') {
        throw new TypeError('Failed to execute \'packing\': parameter 2 is not of type \'Object\'.');
    }
    const { duration, waitTime, capacity } = condition;
    if (duration === undefined && waitTime === undefined && capacity === undefined) {
        throw new TypeError('Failed to execute \'packing\': parameter 2 needs to have properties \'duration\', \'capacity\' or \'waitTime\'.');
    }
    if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
        throw new TypeError('Failed to execute \'packing\': property \'capacity\' of parameter 2 is not a positive integer.');
    }
    validTime('duration', duration);
    validTime('waitTime', waitTime);
    let isCallPut = false;
    let thisArg;
    let box = [];
    let durationDelayId;
    let waitTimeDelayId;
    const assembler = function (...arg) {
        isCallPut = true;
        thisArg = thisArg || this;
        if (arg.length) {
            box = box.concat(arg);
            // condition.capacity;
            const length = box.length;
            if (capacity && length >= capacity) {
                assembler.pack();
                return;
            }
        }
        // condition.duration
        if (duration !== undefined && durationDelayId === undefined) {
            durationDelayId = setDelay(assembler.pack, duration);
        }
        // condition.waitTime
        if (waitTime !== undefined) {
            if (waitTimeDelayId !== undefined) {
                clearDelay(waitTimeDelayId);
            }
            waitTimeDelayId = setDelay(assembler.pack, waitTime);
        }
    };
    assembler.pack = () => {
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
    return assembler;
};
