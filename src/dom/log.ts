/**
 * log 配置选项
 */
export interface LogOptions {
	/**
	 * 是否显示时间
	 * @default true
	 */
	time?: boolean;
	/**
	 * 是否显示调用者文件名
	 * @default true
	 */
	fileName?: boolean;
}

/**
 * 带额外信息的 console.log
 * @param message - 日志消息，支持单条消息或消息数组
 * @param options - 配置选项
 *
 * @example
 * log("调试信息"); // "[14:30:00] [index.ts:15] 调试信息"
 * log("调试信息", { time: false }); // "[index.ts:15] 调试信息"
 * log("调试信息", { fileName: false }); // "[14:30:00] 调试信息"
 * log("调试信息", { time: false, fileName: false }); // "调试信息"
 * log(["消息1", "消息2"]); // "[14:30:00] [index.ts:15] 消息1 消息2"
 */
export const log = (message: any | any[], options?: LogOptions) => {
	const { time = true, fileName = true } = options ?? {};

	const parts: any[] = [];

	// 添加时间前缀
	if (time) {
		parts.push(`[${new Date().toLocaleTimeString()}]`);
	}

	// 添加调用者文件名前缀
	if (fileName) {
		/**
		 * Error
		 *    at...
		 *    at E:\Projects\utils\src\network\fetcher.ts:126
		 *    at...
		 * at ...
		 */
		const { stack } = new Error();

		// at E:\Projects\utils\src\network\fetcher.ts:126
		const callerLine = stack?.split("\n")[2]?.trim();

		// [原文, E:\Projects\utils\src\network\fetcher.ts, 126]
		const match = callerLine?.match(/at\s+(.*):(\d+)/);

		if (match?.[1]) {
			// fetcher.ts
			const fileName = match[1].split(/[/\\]/).pop();
			// fetcher.ts:126
			parts.push(`[${fileName}:${match[2]}]`);
		}
	}

	// 添加调用者原始消息
	if (Array.isArray(message)) {
		parts.push(...message);
	} else {
		parts.push(message);
	}

	console.log(...parts);
};
