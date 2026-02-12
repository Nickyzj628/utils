export type SnakeToCamel<S extends string> = S extends `${infer Before}_${infer After}` ? After extends `${infer First}${infer Rest}` ? `${Before}${Uppercase<First>}${SnakeToCamel<Rest>}` : Before : S;
/**
 * 下划线命名法转为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // "userName"
 */
export declare const snakeToCamel: <S extends string>(str: S) => SnakeToCamel<S>;
export type CamelToSnake<S extends string> = S extends `${infer First}${infer Rest}` ? Rest extends Uncapitalize<Rest> ? `${Lowercase<First>}${CamelToSnake<Rest>}` : `${Lowercase<First>}_${CamelToSnake<Rest>}` : Lowercase<S>;
/**
 * 驼峰命名法转为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // "should_component_update"
 */
export declare const camelToSnake: <S extends string>(str: S) => CamelToSnake<S>;
export type Capitalize<S extends string> = S extends `${infer P1}${infer Rest}` ? P1 extends Capitalize<P1> ? S : `${Uppercase<P1>}${Rest}` : S;
/**
 * 字符串首字母大写
 *
 * @example
 * capitalize("hello") // "Hello"
 */
export declare const capitalize: <S extends string>(s: S) => Capitalize<S>;
export type Decapitalize<S extends string> = S extends `${infer P1}${infer Rest}` ? P1 extends Lowercase<P1> ? P1 : `${Lowercase<P1>}${Rest}` : S;
/**
 * 字符串首字母小写
 *
 * @example
 * decapitalize("Hello") // "hello"
 */
export declare const decapitalize: <S extends string>(s: S) => Decapitalize<S>;
/**
 * 图片地址转 base64 数据
 *
 * @param imageUrl 图片地址
 * @param options 可选配置
 * @param options.quality 压缩比率，默认 0.92（仅在浏览器支持 canvas 压缩时有效）
 *
 * @example
 * imageUrlToBase64("https://example.com/image.gif"); // "data:image/gif;base64,..."
 *
 * @example
 * imageUrlToBase64("https://example.com/image.jpg", { quality: 0.8 }); // 压缩至 80% 质量
 */
export declare const imageUrlToBase64: (imageUrl: string, { quality }?: {
    quality?: number;
}) => Promise<string>;
/**
 * 将字符串压缩为单行精简格式
 *
 * @example
 * // "Hello, world."
 * compactStr(`
 *   Hello,
 *        world!
 * `, {
 *  disableNewLineReplace: false,
 * });
 */
export declare const compactStr: (text?: string, options?: {
    /** 最大保留长度，设为 0 或 Infinity 则不截断，默认 Infinity */
    maxLength?: number;
    /** 是否将换行符替换为字面量 \n，默认开启 */
    disableNewLineReplace?: boolean;
    /** 是否合并连续的空格/制表符为一个空格，默认开启 */
    disableWhitespaceCollapse?: boolean;
    /** 截断后的后缀，默认为 "..." */
    omission?: string;
}) => string;
