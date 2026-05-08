import { isNil, isObject } from "../is";
import { mergeObjects } from "../object";

// 合并标准 RequestInit 和扩展参数
export type RequestInit = globalThis.RequestInit & {
	/**
	 * searchParams 查询参数对象
	 */
	params?: Record<string, any>;
	/**
	 * 响应解析器，默认的解析方法为 response.json()
	 */
	parser?: (response: Response) => Promise<any>;
};

/**
 * 基于 Fetch API 的请求实例
 * @param baseUrl 接口前缀
 * @param baseOptions 应用于整个实例的请求体，后续请求都会带上
 *
 * @remarks
 * 特性：
 * - 支持在创建实例、发出请求时合并相同的请求体（后者覆盖前者）
 * - 支持在 GET 的 params 请求体中传递对象
 * - 支持在 POST、PUT 的 body 请求体中传递对象
 * - 可选 to() 函数转换请求结果为 [Error, Response]
 * - 可选 withCache() 函数缓存请求结果
 *
 * @example
 * // 直接发请求
 * const res = await fetcher().get<Blog>("https://nickyzj.run:3030/blogs/hello-world", {
 *  params: {
 *    page: 2,
 *    pageSize: 10,
 *  }
 * });
 *
 * // 创建实例，发请求
 * const api = fetcher("https://nickyzj.run:3030", {
 *  headers: {
 *    Authorization: "Bearer token"
 *  }
 * });
 * const res = await api.get<Blog>("/blogs/hello-world");
 *
 * // 安全返回请求结果，不抛异常
 * const [error, data] = await to(api.get<Blog>("/blogs/hello-world"));
 * if (error) {
 *  // ...
 * }
 * // ...
 *
 * // 缓存请求结果
 * const getBlogs = withCache(api.get);
 * await getBlogs("/blogs");
 * await getBlogs("/blogs");  // 不发请求，使用缓存
 */
export const fetcher = (baseUrl = "", baseOptions: RequestInit = {}) => {
	const myFetch = async <T>(path: string, requestOptions: RequestInit = {}) => {
		// 构建完整 URL
		const url = new URL(baseUrl ? `${baseUrl}${path}` : path);

		// 合并 options
		const { params, parser, ...options } = mergeObjects(
			baseOptions,
			requestOptions,
		);

		// 转换 params 对象为 URLSearchParams
		if (isObject(params)) {
			Object.entries(params).forEach(([key, value]) => {
				if (!isNil(value)) {
					url.searchParams.append(key, value.toString());
				}
			});
		}

		// 转换 body 对象为 JSON 字符串
		if (isObject(options.body) || Array.isArray(options.body)) {
			options.body = JSON.stringify(options.body);
			options.headers = {
				...options.headers,
				"Content-Type": "application/json",
			};
		}

		// 发出请求
		const response = await fetch(url, options);
		if (!response.ok) {
			// 如果后端给了报错详情，则先解析再抛出
			const contentType = response.headers.get("Content-Type");
			if (contentType?.startsWith("application/json")) {
				const errorData = await response.json();
				const error = new Error(
					errorData.error?.message || response.statusText,
				);
				(error as any).data = errorData;
				throw error;
			}
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
