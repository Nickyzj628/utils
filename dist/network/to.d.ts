/**
 * Go 语言风格的异步处理方式
 * @param promise 一个能被 await 的异步函数
 * @returns 如果成功，返回 [null, 异步函数结果]，否则返回 [Error, undefined]
 *
 * @example
 * const [error, response] = await to(fetcher().get<Blog>("/blogs/hello-world"));
 */
export declare const to: <T, E = Error>(promise: Promise<T>) => Promise<[null, T] | [E, undefined]>;
