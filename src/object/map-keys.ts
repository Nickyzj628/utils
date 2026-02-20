import { isObject } from "../is";

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
