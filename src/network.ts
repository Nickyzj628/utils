import { isObject } from "./is";
import LRUCache from "./lru-cache";

const cachedRequests = new LRUCache<string, Promise<Response>>();

/**
 * 基于 Fetch API 的请求客户端
 * @param baseURL 接口前缀，如 https://nickyzj.run:3030，也可以不填
 * @param defaultOptions 客户端级别的请求选项，方法级别的选项会覆盖这里的相同值
 *
 * @remarks
 * 特性：
 * - 在 body 里直接传递对象
 * - 能够缓存 GET 请求
 *
 * @example
 * // 用法1：创建客户端
 * const api = fetcher("https://nickyzj.run:3030", { headers: { Authorization: "Bearer token" } });
 * const res = await api.get<Blog>("/blogs/hello-world");
 *
 * // 用法2：直接发送请求
 * const res = await fetcher().get<Blog>("https://nickyzj.run:3030/blogs/hello-world");
 */
export const fetcher = (baseURL = "", defaultOptions: RequestInit = {}) => {
  const createRequest = async <T>(path: string, options: RequestInit = {}) => {
    // 构建完整 URL
    const url = baseURL ? `${baseURL}${path}` : path;

    // 处理 body 为对象的情况
    if (isObject(options.body)) {
      options.body = JSON.stringify(options.body);
      options.headers = {
        ...defaultOptions.headers,
        ...options.headers,
        "Content-Type": "application/json",
      };
    }

    const request = () => fetch(url, options);
    const canCache = options.method === "GET" || !options.method;
    let promise: Promise<Response>;
    if (!canCache) {
      promise = request();
    } else {
      let tempPromise = cachedRequests.get(url);
      if (!tempPromise) {
        tempPromise = request();
        cachedRequests.set(url, tempPromise);
      }
      promise = tempPromise;
    }

    // 必须使用 clone() 消费一个新的响应体，否则下次从 cache 中获取的响应体会报错（无法被重复消费）
    const response = (await promise).clone();
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
      body?: any,
      options: Omit<RequestInit, "method" | "body"> = {},
    ) => createRequest<T>(url, { ...options, method: "POST", body }),

    put: <T>(
      url: string,
      body?: any,
      options: Omit<RequestInit, "method" | "body"> = {},
    ) => createRequest<T>(url, { ...options, method: "PUT", body }),

    delete: <T>(url: string, options: Omit<RequestInit, "method"> = {}) =>
      createRequest<T>(url, { ...options, method: "DELETE" }),
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
