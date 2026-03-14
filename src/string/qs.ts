/**
 * 针对 URL 查询字符串的解析和序列化
 * @example
 * qs.parse("?a=1&b=2") // { a: 1, b: 2 }
 * qs.stringify({ a: 1, b: 2 }, { addQueryPrefix: true }) // "?a=1&b=2"
 */
export const qs = {
	/** queryString -> queryParams */
	parse: (queryString: string) => {
		const searchParams = new URLSearchParams(queryString);
		const result: Record<string, any> = {};

		for (const [key, value] of searchParams) {
			// 如果是能被视为数字的字符串，则转为数字
			if (!Number.isNaN(Number(value))) {
				result[key] = Number(value);
			} else {
				result[key] = value;
			}
		}

		return result;
	},
	stringify: (
		params: Record<string, any>,
		options?: {
			/**
			 * 是否在结果前添加“?”
			 * @default false
			 */
			addQueryPrefix: boolean;
		},
	) => {
		const { addQueryPrefix = false } = options ?? {};

		const queryString = new URLSearchParams(params).toString();
		if (!queryString) {
			return "";
		}

		return addQueryPrefix ? `?${queryString}` : queryString;
	},
};
