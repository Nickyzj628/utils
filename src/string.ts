/**
 * 下划线命名法转为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // 'userName'
 */
export const snakeToCamel = (str: string) => {
	return str.replace(/_([a-zA-Z])/g, (match, pattern) => pattern.toUpperCase());
};

/**
 * 驼峰命名法转为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // 'should_component_update'
 */
export const camelToSnake = (str: string) => {
	return str.replace(
		/([A-Z])/g,
		(match, pattern) => `_${pattern.toLowerCase()}`,
	);
};

/**
 * 字符串首字母大写
 *
 * @example
 * capitalize("hello") // 'Hello'
 */
export const capitalize = (s: string) => {
	return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * 字符串首字母小写
 *
 * @example
 * decapitalize("Hello") // 'hello'
 */
export const decapitalize = (s: string) => {
	return s.charAt(0).toLowerCase() + s.slice(1);
};
