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
