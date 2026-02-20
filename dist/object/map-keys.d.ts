export type DeepMapKeys<T> = T extends Array<infer U> ? Array<DeepMapKeys<U>> : T extends object ? {
    [key: string]: DeepMapKeys<T[keyof T]>;
} : T;
/**
 * 递归处理对象里的 key
 *
 * @remarks
 * 无法完整推导出类型，只能做到有递归，key 全为 string，value 为同层级的所有类型的联合
 *
 * @template T 要转换的对象
 *
 * @example
 * const obj = { a: { b: 1 } };
 * const result = mapKeys(obj, (key) => key.toUpperCase());
 * console.log(result); // { A: { B: 1 } }
 */
export declare const mapKeys: <T>(obj: T, getNewKey: (key: string) => string) => DeepMapKeys<T>;
