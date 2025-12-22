export type Primitive = number | string | boolean | symbol | bigint | undefined | null;
export type Falsy = false | 0 | -0 | 0n | "" | null | undefined;
/**
 * 检测传入的值是否为**普通对象**
 *
 * @example
 * const obj = { a: 1 };
 * isObject(obj); // true
 */
export declare const isObject: (value: any) => value is object;
/**
 * 检测传入的值是否为**原始值**（number、string、boolean、symbol、bigint、undefined、null）
 *
 * @example
 * isPrimitive(1);  // true
 * isPrimitive([]); // false
 */
export declare const isPrimitive: (value: any) => value is Primitive;
/**
 * 检测传入的值是否为**假值**（false、0、''、null、undefined、NaN等）
 *
 * @example
 * isFalsy(""); // true
 * isFalsy(1); // false
 */
export declare const isFalsy: (value: any) => value is Falsy;
/**
 * 检测传入的值是否为**真值**
 *
 * @example
 * isTruthy(1); // true
 * isTruthy(""); // false
 */
export declare const isTruthy: (value: any) => value is any;
/**
 * 检测传入的值是否为**空值**（null、undefined）
 *
 * @example
 * isNil(null); // true
 * isNil(undefined); // true
 * isNil(1); // false
 */
export declare const isNil: (value: any) => value is null | undefined;
