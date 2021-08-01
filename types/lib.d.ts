export declare type DelayId = string | ReturnType<typeof setTimeout>;
/**
 * setTimeout where time > 0
 * Promise.resolve() where time === 0
 * @param fn
 * @param time
 */
export declare function setDelay(fn: () => void, time: number): DelayId;
/**
 * clear setDelay
 * @param delayId
 */
export declare function clearDelay(delayId?: DelayId): void;
export declare function getType(t: any): any;
export declare function isPromise(pms: any): boolean;
