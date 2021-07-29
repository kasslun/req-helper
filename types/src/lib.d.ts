export declare type DelayId = string | ReturnType<typeof setTimeout>;
export declare function setDelay(fn: () => void, time: number): DelayId;
export declare function clearDelay(delayId?: DelayId): void;
