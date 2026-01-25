import { isObject, isPrimitive } from "./is";

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

// --- mapKeys ---

// 这里的 DeepMapKeys 只能承诺 key 是 string，无法推断出 key 的具体字面量变化
// 因为 TS 不支持根据任意函数反推 Key 的字面量类型
export type DeepMapKeys<T> =
	T extends Array<infer U>
		? Array<DeepMapKeys<U>>
		: T extends object
			? { [key: string]: DeepMapKeys<T[keyof T]> }
			: T;

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
export const mapKeys = <T>(
	obj: T,
	getNewKey: (key: string) => string,
): DeepMapKeys<T> => {
	// 递归处理数组
	if (Array.isArray(obj)) {
		return obj.map((item) => mapKeys(item, getNewKey)) as any;
	}

	// 处理普通对象
	if (isObject(obj)) {
		const keys = Object.keys(obj);
		return keys.reduce(
			(result, key) => {
				const newKey = getNewKey(key);
				const value = (obj as any)[key];
				result[newKey] = mapKeys(value, getNewKey);
				return result;
			},
			{} as Record<string, any>,
		) as DeepMapKeys<T>;
	}

	// 处理非数组/对象
	return obj as any;
};

// --- mapValues ---

// 这里的 DeepMapValues 尝试保留 key，但将 value 类型替换为 R
// 注意：如果原 value 是对象，我们递归处理结构，而不是把整个对象变成 R
export type DeepMapValues<T, R> =
	T extends Array<infer U>
		? Array<DeepMapValues<U, R>>
		: T extends object
			? { [K in keyof T]: T[K] extends object ? DeepMapValues<T[K], R> : R }
			: R;

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
export const mapValues = <T, R = any>(
	obj: T,
	getNewValue: (value: any, key: string | number) => R,
	options?: {
		/** 过滤函数，返回 true 表示保留该字段 */
		filter?: (value: any, key: string | number) => boolean;
	},
): DeepMapValues<T, R> => {
	const { filter } = options ?? {};

	// 处理数组
	if (Array.isArray(obj)) {
		const mappedArray = obj.map((item, index) => {
			// 如果元素是对象，则递归处理
			if (isObject(item)) {
				return mapValues(item, getNewValue, options);
			}
			// 如果元素是原始值，则直接应用 getNewValue（此时 key 为数组下标）
			return getNewValue(item, index);
		});
		// 如果有过滤器，则过滤一遍元素
		if (filter) {
			return mappedArray.filter((item, index) => filter(item, index)) as any;
		}
		return mappedArray as any;
	}

	// 处理普通对象
	if (isObject(obj)) {
		const keys = Object.keys(obj);
		return keys.reduce((result, key) => {
			const value = (obj as any)[key];
			let newValue: any;
			// 如果值为对象或数组，则递归处理
			if (isObject(value) || Array.isArray(value)) {
				newValue = mapValues(value, getNewValue, options);
			}
			// 否则直接应用 getNewValue
			else {
				newValue = getNewValue(value, key);
			}
			// 如果存在过滤器，则看情况保留该字段
			if (!filter || filter(newValue, key)) {
				result[key] = newValue;
			}
			return result;
		}, {} as any) as DeepMapValues<T, R>;
	}

	// 处理非数组/对象
	return obj as any;
};
