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
export declare const loopUntil: <T>(fn: (count: number) => T | Promise<T>, options?: {
    /**
     * 最大循环次数
     * @default 5
     */
    maxRetries?: number;
    /** 停止循环条件。如果未传递，则执行 maxRetries 次后退出并返回最后结果 */
    shouldStop?: (result: T) => boolean;
}) => Promise<T>;
