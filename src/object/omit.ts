/**
 * 从对象中排除指定的键，返回不包含这些键的新对象
 *
 * @typeParam T - 源对象的类型
 * @typeParam K - 要排除的键，必须是源对象的键之一
 *
 * @param obj - 源对象
 * @param keys - 要排除的键名数组
 * @returns 不包含指定键的新对象
 *
 * @example
 * const user = {
 *  id: 1,
 *  name: "Alice",
 *  age: 25,
 *  password: "secret"
 * };
 * // { id: 1, name: "Alice", age: 25 }
 * const safeUser = omit(user, ["password"]);
 */
export const omit = <T extends Record<string, any>, K extends keyof T>(
	obj: T,
	keys: readonly K[],
): Omit<T, K> => {
	const result = { ...obj };

	for (const key of keys) {
		delete result[key];
	}

	return result as Omit<T, K>;
};

/**
 * 从对象中排除满足条件的键值对，返回不包含这些键的新对象
 *
 * @typeParam T - 源对象的类型
 *
 * @param obj - 源对象
 * @param shouldOmit - 判断函数，接收键和值，返回 `true` 则排除该键值对
 * @returns 不包含满足条件的键值对的新对象
 *
 * @example
 * const user = {
 *  id: 1,
 *  name: "Alice",
 *  age: 25,
 *  password: "secret"
 * };
 * // { name: "Alice", password: "secret" }
 * const stringFields = omitBy(user, (key, value) => typeof value === "number");
 */
export const omitBy = <T extends Record<string, any>>(
	obj: T,
	shouldOmit: (key: keyof T, value: T[keyof T]) => boolean,
): Partial<T> => {
	const result: Partial<T> = {};

	for (const [key, value] of Object.entries(obj)) {
		if (!shouldOmit(key as keyof T, value)) {
			result[key as keyof T] = value;
		}
	}

	return result;
};
