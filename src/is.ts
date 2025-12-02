export type Primitive = number | string | boolean | symbol | bigint | undefined | null;

/**
 * 检测传入的值是否为**普通对象**
 * @returns 如果是普通对象，返回 true，否则返回 false
 */
export const isObject = (value: any): value is object => {
  return value?.constructor === Object;
};

/**
 * 检测传入的值是否为**原始值**（number、string、boolean、symbol、bigint、undefined、null）
 * @returns 如果是原始值，返回 true，否则返回 false
 */
export const isPrimitive = (value: any): value is Primitive => {
  return (
    value === null ||
    value === undefined ||
    (typeof value !== "object" && typeof value !== "function")
  );
};
