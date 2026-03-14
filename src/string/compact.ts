/**
 * 将字符串压缩为单行精简格式
 *
 * @example
 * // "Hello\nworld"
 * compactStr(`Hello,
 *
 *  world
 *
 * !`);
 *
 * @example
 * // "Hello...world" (maxLength: 15)
 * compactStr("Hello, beautiful world!", { maxLength: 15 });
 */
export const compactStr = (
	text: string = "",
	options?: {
		/**
		 * 最大保留长度，超过该长度使用 "..." 替代
		  @default Infinity
		 */
		maxLength?: number;
		/**
		 * 是否将换行符替换为字面量"\n"
		 * @default false
		 */
		disableNewLineReplace?: boolean;
		/**
		 * 是否合并连续的换行符/制表符为单个
		 * @default false
		 */
		disableCollapse?: boolean;
	},
): string => {
	if (!text) return "";

	const {
		maxLength = Infinity,
		disableNewLineReplace = false,
		disableCollapse = false,
	} = options ?? {};

	let result = text;

	// 先合并连续的换行符和制表符
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
		return result.slice(0, maxLength) + "...";
	}

	return result;
};
