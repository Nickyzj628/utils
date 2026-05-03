import { isObject } from "../is";

/** 从任意异常中提取类似 error.message 的可读文字 */
export const extractErrorMessage = (error: unknown): string => {
	// 如果是原生异常，则返回 message 字段
	if (error instanceof Error) {
		return error.message;
	}

	// 如果已经是字符串了，则直接返回
	if (typeof error === "string") {
		return error;
	}

	// 如果是自定义对象，则尝试提取可能的报错字段
	if (isObject(error)) {
		const directMessage = error.message || error.msg;
		if (directMessage) {
			return directMessage;
		}
		// 遍历对象的所有字段，找出可能的报错字段
		for (const value of Object.values(error)) {
			const message = extractErrorMessage(value);
			if (message) {
				return message;
			}
		}
	}

	// 兜底情况，将异常转换为字符串返回
	return JSON.stringify(error, null, 2);
};
