import { isObject } from "../is";

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
