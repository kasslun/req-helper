/**
 *
 * @param fn
 * @param cacheTime
 * @param maxTasks
 */
export default function <T, U, V, W = string | number>(fn: (this: U, setAbortHandler: (abortHandler: () => void) => void, cacheKey?: W, ...args: V[]) => Promise<T>, { cacheTime, maxTasks }?: {
    readonly cacheTime?: number;
    readonly maxTasks?: number;
}): (this: U, cacheKey?: W, ...args: V[]) => Promise<T>;
