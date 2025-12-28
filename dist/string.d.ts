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
/**
 * 将字符串压缩为单行精简格式
 *
 * @example
 * // "Hello, world."
 * compactStr(`
 *   Hello,
 *        world!
 * `, {
 *  escapeNewlines: false,
 * });
 */
export declare const compactStr: (text?: string, options?: {
    /** 最大保留长度，设为 0 或 Infinity 则不截断，默认 100 */
    maxLength?: number;
    /** 是否将换行符替换为字面量 \n，默认开启 */
    escapeNewlines?: boolean;
    /** 是否合并连续的空格/制表符为一个空格，默认开启 */
    collapseWhitespace?: boolean;
    /** 截断后的后缀，默认为“...” */
    omission?: string;
}) => string;
