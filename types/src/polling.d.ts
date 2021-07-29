interface IPollingRet {
    readonly stop: () => void;
    readonly resume: () => void;
    readonly refresh: (newGap?: number) => void;
}
declare const _default: <T>(fn: () => Promise<T>, gap?: number) => IPollingRet;
/**
 * polling
 * call fn where fn().finally
 * @param fn
 * @param gap
 */
export default _default;
