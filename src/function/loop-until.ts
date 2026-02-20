/**
 * 循环执行函数，直到符合停止条件
 *
 * @example
 * // 循环请求大语言模型，直到其不再调用工具
 * loopUntil(
 *   async () => {
 *     const completion = await chatCompletions();
 *     completion.tool_calls?.forEach(chooseAndHandleTool)
 *     return completion;
 *   },
 *   {
 *     shouldStop: (completion) => !completion.tool_calls,
 *   },
 * ),
 *
 * @example
 * // 不传递 shouldStop，执行 3 次后正常返回最后结果
 * loopUntil(
 *   () => {
 *     return doSomething();
 *   },
 *   {
 *     maxRetries: 3,
 *   },
 * ),
 */
export const loopUntil = async <T>(
	fn: (count: number) => T | Promise<T>,
	options?: {
		/**
		 * 最大循环次数
		 * @default 5
		 */
		maxRetries?: number;
		/** 停止循环条件。如果未传递，则执行 maxRetries 次后退出并返回最后结果 */
		shouldStop?: (result: T) => boolean;
	},
): Promise<T> => {
	const { maxRetries = 5, shouldStop } = options ?? {};

	let lastResult: T | undefined;

	for (let i = 0; i < maxRetries; i++) {
		lastResult = await fn(i);
		if (shouldStop?.(lastResult) === true) {
			return lastResult;
		}
	}

	// 循环结束时，如果未传递 shouldStop，则正常退出并返回最终结果
	if (!shouldStop) {
		return lastResult as T;
	}

	// 否则抛出异常
	throw new Error(`超过了最大循环次数（${maxRetries}）且未满足停止执行条件`);
};
