/**
 * 深度合并两个对象，规则如下：
 * 1. 原始值覆盖：如果两个值都是原始类型，则用后者覆盖;
 * 2. 数组拼接：如果两个值都是数组，则拼接为大数组；
 * 3. 对象递归合并：如果两个值都是对象，则进行递归深度合并；
 *
 * @template T 第一个对象
 * @template U 第二个对象
 * @param {T} obj1 要合并的第一个对象，相同字段会被 obj2 覆盖
 * @param {U} obj2 要合并的第二个对象
 */
export declare const mergeObjects: <T extends Record<string, any>, U extends Record<string, any>>(obj1: T, obj2: U) => T & U;
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
export type DeepMapValues<T, R> = T extends Array<infer U> ? Array<DeepMapValues<U, R>> : T extends object ? {
    [K in keyof T]: T[K] extends object ? DeepMapValues<T[K], R> : R;
} : R;
/**
 * 递归处理对象里的 value
 *
 * @remarks
 * 无法完整推导出类型，所有 value 最终都会变为 any
 *
 * @template T 要转换的对象
 * @template R 转换后的值类型，为 any，无法进一步推导
 *
 * @example
 * const obj = { a: 1, b: { c: 2 } };
 * const result = mapValues(obj, (value, key) => isPrimitive(value) ? value + 1 : value);
 * console.log(result); // { a: 2, b: { c: 3 } }
 */
export declare const mapValues: <T, R = any>(obj: T, getNewValue: (value: any, key: string | number) => R, options?: {
    /** 过滤函数，返回 true 表示保留该字段 */
    filter?: (value: any, key: string | number) => boolean;
}) => DeepMapValues<T, R>;
