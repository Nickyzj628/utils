export type SnakeToCamel<S extends string> =
	S extends `${infer Before}_${infer After}`
		? After extends `${infer First}${infer Rest}`
			? `${Before}${Uppercase<First>}${SnakeToCamel<Rest>}`
			: Before
		: S;

/**
 * 下划线命名法转为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // "userName"
 */
export const snakeToCamel = <S extends string>(str: S): SnakeToCamel<S> => {
	return str.replace(/_([a-zA-Z])/g, (match, pattern) =>
		pattern.toUpperCase(),
	) as SnakeToCamel<S>;
};

export type CamelToSnake<S extends string> =
	S extends `${infer First}${infer Rest}`
		? Rest extends Uncapitalize<Rest>
			? `${Lowercase<First>}${CamelToSnake<Rest>}`
			: `${Lowercase<First>}_${CamelToSnake<Rest>}`
		: Lowercase<S>;

/**
 * 驼峰命名法转为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // "should_component_update"
 */
export const camelToSnake = <S extends string>(str: S): CamelToSnake<S> => {
	return str.replace(
		/([A-Z])/g,
		(match, pattern) => `_${pattern.toLowerCase()}`,
	) as CamelToSnake<S>;
};

export type Capitalize<S extends string> = S extends `${infer P1}${infer Rest}`
	? P1 extends Capitalize<P1>
		? S
		: `${Uppercase<P1>}${Rest}`
	: S;

/**
 * 字符串首字母大写
 *
 * @example
 * capitalize("hello") // "Hello"
 */
export const capitalize = <S extends string>(s: S): Capitalize<S> => {
	return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<S>;
};

export type Decapitalize<S extends string> =
	S extends `${infer P1}${infer Rest}`
		? P1 extends Lowercase<P1>
			? P1
			: `${Lowercase<P1>}${Rest}`
		: S;

/**
 * 字符串首字母小写
 *
 * @example
 * decapitalize("Hello") // "hello"
 */
export const decapitalize = <S extends string>(s: S): Decapitalize<S> => {
	return (s.charAt(0).toLowerCase() + s.slice(1)) as Decapitalize<S>;
};
