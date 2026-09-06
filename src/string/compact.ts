/**
 * 将字符串压缩为单行精简格式
 *
 * @example
 * // 换行符被替换为字面量"\n"
 * // "Hello,\nworld!"
 * compactStr("Hello,\nworld!");
 *
 * @example
 * // 超过maxLength时截断末尾
 * // "Hello, beautifu..."
 * compactStr("Hello, beautiful world!", { maxLength: 15 });
 *
 * @example
 * // 超过maxLength时保留首尾
 * // "abcde...vwxyz"
 * compactStr("abcdefghijklmnopqrstuvwxyz", { maxLength: 10, truncateMiddle: true });
 */
export const compactStr = (
	text: string,
	options?: {
		/**
		 * 最大保留长度，超过该长度的内容用"..."替代
		 * @default Infinity
		 */
		maxLength?: number;
		/**
		 * 禁止把换行符替换为字面量"\n"
		 * @default false
		 */
		disableNewLineReplace?: boolean;
		/**
		 * 禁止把连续的换行符/制表符合并为单个
		 * @default false
		 */
		disableCollapse?: boolean;
		/**
		 * 是否截断中间内容，保留首尾
		 * @default false
		 */
		truncateMiddle?: boolean;
	},
) => {
	if (!text) {
		return "";
	}

	const {
		maxLength = Infinity,
		disableNewLineReplace = false,
		disableCollapse = false,
		truncateMiddle = false,
	} = options ?? {};

	let result = text;

	// 合并连续的换行符/制表符
	if (!disableCollapse) {
		result = result.replace(/[\n\t]+/g, "\n");
	}

	// 处理换行符为字面量“\n”
	if (!disableNewLineReplace) {
		result = result.replace(/\r?\n/g, "\\n");
	} else {
		result = result.replace(/\r?\n/g, " ");
	}

	// 合并连续空格
	result = result.replace(/\s+/g, " ").trim();

	// 截断多出来的文字
	if (maxLength > 0 && result.length > maxLength) {
		// - 从中间截断：首尾均分maxLength
		if (truncateMiddle) {
			const headLength = Math.ceil(maxLength / 2);
			const tailLength = maxLength - headLength;
			return `${result.slice(0, headLength)}...${result.slice(result.length - tailLength)}`;
		}

		// - 从末尾截断
		return `${result.slice(0, maxLength)}...`;
	}

	return result;
};
