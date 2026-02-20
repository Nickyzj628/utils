/**
 * 检测传入的值是否为**空值**（null、undefined）
 *
 * @example
 * isNil(null); // true
 * isNil(undefined); // true
 * isNil(1); // false
 */
export const isNil = (value: any): value is null | undefined => {
	return value === null || value === undefined;
};
