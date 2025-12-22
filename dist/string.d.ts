/**
 * 下划线命名法转为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // "userName"
 */
export declare const snakeToCamel: (str: string) => string;
/**
 * 驼峰命名法转为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // "should_component_update"
 */
export declare const camelToSnake: (str: string) => string;
/**
 * 字符串首字母大写
 *
 * @example
 * capitalize("hello") // "Hello"
 */
export declare const capitalize: (s: string) => string;
/**
 * 字符串首字母小写
 *
 * @example
 * decapitalize("Hello") // "hello"
 */
export declare const decapitalize: (s: string) => string;
/**
 * 图片地址转 base64 数据
 *
 * @example
 * imageUrlToBase64("https://example.com/image.jpg"); // "data:image/jpeg;base64,..."
 */
export declare const imageUrlToBase64: (imageUrl: string) => Promise<string>;
