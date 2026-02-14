/**
 * 延迟一段时间再执行后续代码
 * @param time 延迟时间，默认 150ms
 * @example
 * await sleep(1000); // 等待 1 秒执行后续代码
 */
export declare const sleep: (time?: number) => Promise<unknown>;
