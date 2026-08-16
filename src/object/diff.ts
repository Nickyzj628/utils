import { isObject } from "../is";

export type DiffResults = {
	type: "CREATE" | "UPDATE" | "DELETE";
	path: string[];
	value: any;
}[];

/**
 * 比较2个对象，返回两者间的差异（CREATE/UPDATE/DELETE）
 *
 * @template T 第一个对象
 * @template U 第二个对象
 * @param obj1 要比较的第一个对象
 * @param obj2 要比较的第二个对象
 * @param currentPath 当前递归所在的路径
 *
 * @example
 * const obj1 = { a: 1, b: 2 };
 * const obj2 = { b: 3, c: { d: 4 } };
 * // [
 * //   { type: 'DELETE', path: [ 'a' ], value: 1 },
 * //   { type: 'UPDATE', path: [ 'b' ], value: 3 },
 * //   { type: 'CREATE', path: [ 'c' ], value: { d: 4 } }
 * // ]
 * const result = diffObjects(obj1, obj2);
 */
export const diffObjects = <
	T extends Record<string, any>,
	U extends Record<string, any>,
>(
	obj1: T,
	obj2: U,
	currentPath: string[] = [],
	visited = new WeakMap<object, WeakSet<object>>(),
) => {
	const results: DiffResults = [];

	// 如果obj1和obj2已经比较过，则说明存在循环，跳过
	const visitedObjSet = visited.getOrInsert(obj1, new WeakSet());
	if (visitedObjSet.has(obj2)) {
		return [];
	}
	visitedObjSet.add(obj2);

	// 先遍历obj1，处理DELETE
	for (const key of Object.keys(obj1)) {
		// 如果obj2里没有这个key，则标记DELETE
		if (!(key in obj2)) {
			results.push({
				type: "DELETE",
				path: [...currentPath, key],
				value: obj1[key],
			});
		}
	}

	// 再遍历obj2，处理CREATE/UPDATE
	for (const key of Object.keys(obj2)) {
		const val1 = obj1[key];
		const val2 = obj2[key];
		const path = [...currentPath, key];

		// 如果obj1没有这个key，则标记CREATE
		if (!(key in obj1)) {
			results.push({
				type: "CREATE",
				path,
				value: val2,
			});
			continue;
		}

		// 如果两边相等，则跳过
		if (val1 === val2) {
			continue;
		}

		// 如果都是数组/对象，则递归比较其中的元素
		if (
			(Array.isArray(val1) && Array.isArray(val2)) ||
			(isObject(val1) && isObject(val2))
		) {
			results.push(...diffObjects(val1, val2, path, visited));
			continue;
		}

		// 如果两边不相等，则标记UPDATE
		results.push({
			type: "UPDATE",
			path,
			value: val2,
		});
	}

	return results as DiffResults;
};
