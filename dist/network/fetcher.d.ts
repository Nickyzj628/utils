export type BunFetchOptions = {
    /** 代理服务器配置（仅 Bun 支持） */
    proxy?: string;
};
export type RequestInit = globalThis.RequestInit & BunFetchOptions & {
    params?: Record<string, any>;
    parser?: (response: Response) => Promise<any>;
};
/**
 * 基于 Fetch API 的请求客户端
 * @param baseURL 接口前缀
 * @param baseOptions 客户端级别的请求体，后续调用时传递相同参数会覆盖上去
 *
 * @remarks
 * 特性：
 * - 合并实例、调用时的相同请求体
 * - 在 params 里传递对象，自动转换为 queryString
 * - 在 body 里传递对象，自动 JSON.stringify
 * - 可选择使用 to() 转换请求结果为 [Error, Response]
 * - 可选择使用 withCache() 缓存请求结果
 * - 支持 proxy 选项（仅在 Bun 环境有效）
 *
 * @example
 *
 * // 用法1：直接发送请求
 * const res = await fetcher().get<Blog>("https://nickyzj.run:3030/blogs/hello-world");
 *
 * // 用法2：创建实例
 * const api = fetcher("https://nickyzj.run:3030", { headers: { Authorization: "Bearer token" } });
 * const res = await api.get<Blog>("/blogs/hello-world", { headers: {...}, params: { page: 1 } });  // 与实例相同的 headers 会覆盖上去，params 会转成 ?page=1 跟到 url 后面
 *
 * // 用法3：使用代理（仅 Bun 环境）
 * const api = fetcher("https://api.example.com", {
 *   proxy: "http://127.0.0.1:7890"
 * });
 *
 * // 安全处理请求结果
 * const [error, data] = await to(api.get<Blog>("/blogs/hello-world"));
 * if (error) {
 *   console.error(error);
 *   return;
 * }
 * console.log(data);
 *
 * // 缓存请求结果
 * const getBlogs = withCache(api.get);
 * await getBlogs("/blogs");
 * await sleep();
 * await getBlogs("/blogs");  // 不发请求，使用缓存
 */
export declare const fetcher: (baseURL?: string, baseOptions?: RequestInit) => {
    get: <T>(url: string, options?: Omit<RequestInit, "method">) => Promise<T>;
    post: <T>(url: string, body: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
    put: <T>(url: string, body: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
    delete: <T>(url: string, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
};
