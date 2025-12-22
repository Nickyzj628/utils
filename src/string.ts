import { fetcher } from "./network";

/**
 * 下划线命名法转为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // "userName"
 */
export const snakeToCamel = (str: string) => {
	return str.replace(/_([a-zA-Z])/g, (match, pattern) => pattern.toUpperCase());
};

/**
 * 驼峰命名法转为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // "should_component_update"
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
 * capitalize("hello") // "Hello"
 */
export const capitalize = (s: string) => {
	return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * 字符串首字母小写
 *
 * @example
 * decapitalize("Hello") // "hello"
 */
export const decapitalize = (s: string) => {
	return s.charAt(0).toLowerCase() + s.slice(1);
};

/**
 * 图片地址转 base64 数据
 *
 * @example
 * imageUrlToBase64("https://example.com/image.jpg"); // "data:image/jpeg;base64,..."
 */
export const imageUrlToBase64 = async (imageUrl: string) => {
	if (!imageUrl.startsWith("http")) {
		throw new Error("图片地址必须以http或https开头");
	}

	let mime = "";
	const response = await fetcher().get<ArrayBuffer>(imageUrl, {
		parser: (response) => {
			mime = response.headers.get("Content-Type") || "image/jpeg";
			return response.arrayBuffer();
		},
	});
	const buffer = Buffer.from(response);

	const base64 = buffer.toString("base64");
	return `data:${mime};base64,${base64}`;
};
