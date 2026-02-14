export type Primitive = number | string | boolean | symbol | bigint | undefined | null;
/**
 * 检测传入的值是否为**原始值**（number、string、boolean、symbol、bigint、undefined、null）
 *
 * @example
 * isPrimitive(1);  // true
 * isPrimitive([]); // false
 */
export declare const isPrimitive: (value: any) => value is Primitive;
