interface IPackingRet<T> {
    (arg: T): void;
    pack: () => boolean;
}
interface IPackingCondition {
    readonly duration?: number;
    readonly capacity?: number;
    readonly waitTime?: number;
}
declare const _default: <T>(receiver: (arg: T[]) => any, condition: IPackingCondition, receiveEmpty?: boolean) => IPackingRet<T>;
export default _default;
