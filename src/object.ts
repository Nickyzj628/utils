import { isObject } from "./is";

export const mergeObjects = (...objects: Record<string, any>[]) => {
  return objects.reduce(
    (acc: Record<string, any>, obj: Record<string, any>) => {
      if (!isObject(obj)) {
        return acc;
      }

      Object.keys(obj).forEach((key) => {
        const accValue = acc[key];
        const objValue = obj[key];

        // 如果两个值都是数组，则合并数组
        if (Array.isArray(accValue) && Array.isArray(objValue)) {
          acc[key] = [...accValue, ...objValue];
        }
        // 如果两个值都是对象，则递归合并
        else if (isObject(objValue) && isObject(accValue)) {
          acc[key] = mergeObjects(accValue, objValue);
        }
        // 其他情况直接覆盖
        else {
          acc[key] = objValue;
        }
      });

      return acc;
    },
    {},
  );
};
