/**
 * 检测传入的值是否为**普通对象**
 *
 * @example
 * const obj = { a: 1 };
 * isObject(obj); // true
 */
export declare const isObject: (value: any) => value is Record<string, any>;
