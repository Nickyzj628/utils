import { to } from "./to";

/** 从 url 响应头获取真实链接 */
export const getRealURL = async (originURL: string) => {
	const [error, response] = await to(
		fetch(originURL, {
			method: "HEAD", // 用 HEAD 减少数据传输
			redirect: "manual", // 手动处理重定向
		}),
	);

	if (error) {
		return originURL;
	}

	const location = response.headers.get("location");
	return location || originURL;
};
