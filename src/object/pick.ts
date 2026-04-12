/**
 * 从对象中选取指定的键，返回仅包含这些键的新对象
 *
 * @typeParam T - 源对象的类型
 * @typeParam K - 要选取的键，必须是源对象的键之一
 *
 * @param obj - 源对象
 * @param keys - 要选取的键名数组
 * @returns 仅包含指定键的新对象
 *
 * @example
 * const user = {
 *  id: 1,
 *  name: "Alice",
 *  age: 25,
 *  password: "secret"
 * };
 * // { id: 1, name: "Alice", age: 25 }
 * const safeUser = pick(user, ["id", "name", "age"]);
 */
export const pick = <T extends Record<string, any>, K extends keyof T>(
	obj: T,
	keys: readonly K[],
): Pick<T, K> => {
	return keys.reduce(
		(result, key) => {
			if (Object.hasOwn(obj, key)) {
				result[key] = obj[key];
			}
			return result;
		},
		{} as Pick<T, K>,
	);
};

/**
 * 从对象中选取满足条件的键值对，返回仅包含这些键的新对象
 *
 * @typeParam T - 源对象的类型
 *
 * @param obj - 源对象
 * @param shouldPick - 判断函数，返回 `true` 时保留该字段
 * @returns 仅包含满足条件的键值对的新对象
 *
 * @example
 * const user = {
 *  id: 1,
 *  name: "Alice",
 *  age: 25,
 *  password: "secret"
 * };
 * // { id: 1, age: 25 }
 * const numericFields = pickBy(user, (key, value) => typeof value === "number");
 */
export const pickBy = <T extends Record<string, any>>(
	obj: T,
	shouldPick: (key: keyof T, value: T[keyof T]) => boolean,
): Partial<T> => {
	const result: Partial<T> = {};

	for (const [key, value] of Object.entries(obj)) {
		if (shouldPick(key as keyof T, value)) {
			result[key as keyof T] = value;
		}
	}

	return result;
};
