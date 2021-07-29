interface IPut<T> {
    (arg: T): void;
    pack: () => void;
}
declare const _default: <T, U>(receiver: (this: U, arg: T[]) => any, condition: {
    readonly duration?: number;
    readonly waitTime?: number;
    readonly capacity?: number;
}) => IPut<T>;
export default _default;
