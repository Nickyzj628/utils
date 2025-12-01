import { isObject, isPrimitive } from "./is";

export const mergeObjects = <
  T extends Record<string, any>,
  U extends Record<string, any>,
>(
  obj1: T,
  obj2: U,
) => {
  const result: Record<string, any> = { ...obj1 };

  for (const key of Object.keys(obj2)) {
    const val1 = result[key];
    const val2 = obj2[key];

    // 如果都是原始值，则用后者覆盖
    if (isPrimitive(val1) && isPrimitive(val2)) {
      result[key] = val2;
      continue;
    }

    // 如果都是数组，则拼接为大数组
    if (Array.isArray(val1) && Array.isArray(val2)) {
      result[key] = val1.concat(val2);
      continue;
    }

    // 如果都是对象，则深度递归合并
    if (isObject(val1) && isObject(val2)) {
      result[key] = mergeObjects(val1, val2);
      continue;
    }

    // 如果类型不同，则用后者覆盖
    result[key] = val2;
  }

  return result as T & U;
};
