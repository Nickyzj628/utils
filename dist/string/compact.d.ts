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
