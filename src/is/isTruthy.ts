/**
 * 检测传入的值是否为**真值**
 *
 * @example
 * isTruthy(1); // true
 * isTruthy(""); // false
 */
export const isTruthy = (value: any): value is any => {
	return !!value;
};
