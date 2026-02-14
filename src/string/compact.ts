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
export const compactStr = (
	text: string = "",
	options?: {
		/** 最大保留长度，设为 0 或 Infinity 则不截断，默认 Infinity */
		maxLength?: number;
		/** 是否将换行符替换为字面量 \n，默认开启 */
		disableNewLineReplace?: boolean;
		/** 是否合并连续的空格/制表符为一个空格，默认开启 */
		disableWhitespaceCollapse?: boolean;
		/** 截断后的后缀，默认为 "..." */
		omission?: string;
	},
): string => {
	if (!text) return "";

	const {
		maxLength = Infinity,
		disableNewLineReplace = false,
		disableWhitespaceCollapse = false,
		omission = "...",
	} = options ?? {};

	let result = text;

	// 处理换行符
	if (!disableNewLineReplace) {
		result = result.replace(/\r?\n/g, "\\n");
	} else {
		result = result.replace(/\r?\n/g, " ");
	}

	// 合并连续空格
	if (!disableWhitespaceCollapse) {
		result = result.replace(/\s+/g, " ");
	}
	result = result.trim();

	// 截断多出来的文字
	if (maxLength > 0 && result.length > maxLength) {
		return result.slice(0, maxLength) + omission;
	}

	return result;
};
