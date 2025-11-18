/**
 * 基于 Fetch API 的请求客户端
 * @param baseURL 接口前缀，如 https://nickyzj.run:3030，也可以不填
 *
 * @remarks
 * 特性：
 * - 在 body 里直接传递对象
 * - 能够缓存 GET 请求
 *
 * @example
 * // 用法1：创建客户端
 * const api = fetcher("https://nickyzj.run:3030");
 * const res = await api.get<Blog>("/blogs/hello-world");
 *
 * // 用法2：直接发送请求
 * const res = await fetcher().get<Blog>("https://nickyzj.run:3030/blogs/hello-world");
 */
export declare const fetcher: (baseURL?: string) => {
    get: <T>(url: string, options?: Omit<RequestInit, "method">) => Promise<T>;
    post: <T>(url: string, body?: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
    put: <T>(url: string, body?: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
    delete: <T>(url: string, options?: Omit<RequestInit, "method">) => Promise<T>;
};
/**
 * Go 语言风格的异步处理方式
 * @param promise 一个能被 await 的异步函数
 * @returns 如果成功，返回 [null, 异步函数结果]，否则返回 [Error, undefined]
 *
 * @example
 * const [error, response] = await to(fetcher().get<Blog>("/blogs/hello-world"));
 */
export declare const to: <T, Error>(promise: Promise<T>) => Promise<[null, T] | [Error, undefined]>;
