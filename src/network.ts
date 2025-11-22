import { isObject } from "./is";
import { mergeObjects } from "./object";

/**
 * 基于 Fetch API 的请求客户端
 * @param baseURL 接口前缀，如 https://nickyzj.run:3030，也可以不填
 * @param defaultOptions 客户端级别的请求选项，方法级别的选项会覆盖这里的相同值
 *
 * @remarks
 * 特性：
 * - 合并客户端级别、方法级别的请求选项
 * - 在 body 里直接传递对象
 * - 可选择使用 to() 处理返回结果为 [Error, Response]
 * - 可选择使用 withCache() 缓存请求结果
 *
 * @example
 * // 用法1：创建客户端
 * const api = fetcher("https://nickyzj.run:3030", { headers: { Authorization: "Bearer token" } });
 * const res = await api.get<Blog>("/blogs/hello-world");
 *
 * // 用法2：直接发送请求
 * const res = await fetcher().get<Blog>("https://nickyzj.run:3030/blogs/hello-world");
 *
 * // 安全处理返回结果
 * const [error, data] = await to(api.get<Blog>("/blogs/hello-world"));
 * if (error) {
 *   console.error(error);
 *   return;
 * }
 *
 * // 缓存请求结果
 * const getBlogs = withCache(api.get);
 * await getBlogs("/blogs");
 * await sleep(1000);
 * await getBlogs("/blogs");  // 不请求，使用缓存结果
 */
export const fetcher = (baseURL = "", defaultOptions: RequestInit = {}) => {
  const createRequest = async <T>(
    path: string,
    requestOptions: RequestInit = {},
  ) => {
    // 构建完整 URL
    const url = baseURL ? `${baseURL}${path}` : path;

    // 合并 options
    const options = mergeObjects(defaultOptions, requestOptions);

    // 转换 body 为字符串
    if (isObject(options.body)) {
      options.body = JSON.stringify(options.body);
      options.headers = {
        "Content-Type": "application/json",
      };
    }

    // 发送请求
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = await response.json();
    return data as T;
  };

  return {
    get: <T>(url: string, options: Omit<RequestInit, "method"> = {}) =>
      createRequest<T>(url, { ...options, method: "GET" }),

    post: <T>(
      url: string,
      body: any,
      options: Omit<RequestInit, "method" | "body"> = {},
    ) => createRequest<T>(url, { ...options, method: "POST", body }),

    put: <T>(
      url: string,
      body: any,
      options: Omit<RequestInit, "method" | "body"> = {},
    ) => createRequest<T>(url, { ...options, method: "PUT", body }),

    delete: <T>(
      url: string,
      options: Omit<RequestInit, "method" | "body"> = {},
    ) => createRequest<T>(url, { ...options, method: "DELETE" }),
  };
};

/**
 * Go 语言风格的异步处理方式
 * @param promise 一个能被 await 的异步函数
 * @returns 如果成功，返回 [null, 异步函数结果]，否则返回 [Error, undefined]
 *
 * @example
 * const [error, response] = await to(fetcher().get<Blog>("/blogs/hello-world"));
 */
export const to = async <T, U = Error>(
  promise: Promise<T>,
): Promise<[null, T] | [U, undefined]> => {
  try {
    const response = await promise;
    return [null, response];
  } catch (error) {
    return [error as U, undefined];
  }
};
