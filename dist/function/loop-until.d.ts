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
 */
export declare const loopUntil: <T>(fn: (count: number) => Promise<T>, options?: {
    /** 最大循环次数，默认 5 次 */
    maxRetries?: number;
    /** 停止循环条件，默认立即停止 */
    shouldStop?: (result: T) => boolean;
}) => Promise<T>;
