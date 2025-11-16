/**
 * 基于 Fetch API 的请求客户端
 * @example
 * // 用法1：创建客户端
 * const api = fetcher("https://nickyzj.run:3030");
 * const res = await api.get<Blog>("/blogs/2025/猩猩也能懂的Node.js部署教程");
 *
 * // 用法2：直接发送请求
 * const res = await fetcher().get<Blog>("https://nickyzj.run:3030/blogs/2025/猩猩也能懂的Node.js部署教程");
 */
export declare const fetcher: (baseURL?: string) => {
    get: <T>(url: string, options?: Omit<RequestInit, "method">) => Promise<T>;
    post: <T>(url: string, body?: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
    put: <T>(url: string, body?: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
    delete: <T>(url: string, options?: Omit<RequestInit, "method">) => Promise<T>;
};
/**
 * Go 语言风格的异步处理方式
 * @example
 * const [error, response] = await to(request<Resp>("/blogs/2025/猩猩也能懂的Node.js部署教程"));
 */
export declare const to: <T, U = Error>(promise: Promise<T>) => Promise<[null, T] | [U, undefined]>;
