import { isObject, isPrimitive } from "../is";

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

		// 其他情况用后者覆盖
		result[key] = val2;
	}

	return result as T & U;
};
