export type Primitive =
	| number
	| string
	| boolean
	| symbol
	| bigint
	| undefined
	| null;

export type Falsy = false | 0 | -0 | 0n | "" | null | undefined;

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

/**
 * 检测传入的值是否为**false值**（false、0、''、null、undefined、NaN等）
 */
export const isFalsy = (value: any): value is Falsy => {
	return !value;
};

/**
 * 检测传入的值是否为**空值**（null、undefined）
 */
export const isNil = (value: any): value is null | undefined => {
	return value === null || value === undefined;
};
