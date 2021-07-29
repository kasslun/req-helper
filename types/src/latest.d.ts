interface ILatestConfig {
    readonly cacheTime?: number;
    readonly maxTasks?: number;
}
interface ILatestHandler<T> {
    (condition: any, setCancelHandler: (cancelHandler: () => void) => void): Promise<T>;
}
/**
 *
 * @param fn
 * @param cacheTime
 * @param maxTasks
 */
export default function <T>(fn: ILatestHandler<T>, { cacheTime, maxTasks }?: ILatestConfig): (condition: any) => Promise<T>;
export {};
