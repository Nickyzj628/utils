import { isObject } from "./is";
import { mergeObjects } from "./object";

export type RequestInit = BunFetchRequestInit & {
	params?: Record<string, string>;
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
export const fetcher = (baseURL = "", baseOptions: RequestInit = {}) => {
	const myFetch = async <T>(path: string, requestOptions: RequestInit = {}) => {
		// 构建完整 URL
		const url = new URL(baseURL ? `${baseURL}${path}` : path);

		// 合并 options
		const { params, parser, ...options } = mergeObjects(
			baseOptions,
			requestOptions,
		);

		// 转换 params 为查询字符串
		if (isObject(params)) {
			Object.entries(params).forEach(([key, value]) => {
				url.searchParams.append(key, value.toString());
			});
		}

		// 转换 body 为字符串
		if (isObject(options.body)) {
			options.body = JSON.stringify(options.body);
			options.headers = {
				...options.headers,
				"Content-Type": "application/json",
			};
		}

		// 发送请求
		const response = await fetch(url, options);
		if (!response.ok) {
			throw new Error(response.statusText);
		}

		const data = await (parser?.(response) ?? response.json());
		return data as T;
	};

	return {
		get: <T>(url: string, options?: Omit<RequestInit, "method">) =>
			myFetch<T>(url, { ...options, method: "GET" }),

		post: <T>(
			url: string,
			body: any,
			options?: Omit<RequestInit, "method" | "body">,
		) => myFetch<T>(url, { ...options, method: "POST", body }),

		put: <T>(
			url: string,
			body: any,
			options?: Omit<RequestInit, "method" | "body">,
		) => myFetch<T>(url, { ...options, method: "PUT", body }),

		delete: <T>(url: string, options?: Omit<RequestInit, "method" | "body">) =>
			myFetch<T>(url, { ...options, method: "DELETE" }),
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
