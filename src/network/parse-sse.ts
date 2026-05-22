/**
 * 分段解析 SSE 流式响应内容
 * @param response Fetch API 返回的响应对象
 * @returns 可被 `for await () {}` 消费的异步迭代器
 * @example
 * const response = await fetch("/chat/completions", { stream: true });
 * for await (const data of parseSSE(response)) {
 *     console.log(data.choices);
 *     console.log(data.usage);
 * }
 */
export async function* parseSSE<T = any>(
	response: Response,
): AsyncIterableIterator<T> {
	const reader = response.body?.getReader();
	if (!reader) {
		return;
	}

	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				break;
			}

			// 1. 将二进制流转换成字符串
			buffer += decoder.decode(value, { stream: true });

			// 2. 根据 SSE 规范，把消息用 \n\n 分隔
			const parts = buffer.split("\n\n");

			// 3. 最后一条消息可能还不完整，留到下次循环处理
			buffer = parts.pop() || "";

			for (const part of parts) {
				const lines = part.split("\n");
				for (const line of lines) {
					// 4. 只处理以 data: 开头的行
					if (!line.startsWith("data:")) {
						continue;
					}

					const dataContent = line.replace(/^data:\s*/, "").trim();
					try {
						// 尝试解析为结构化数据
						yield JSON.parse(dataContent) as T;
					} catch {
						// 返回原始内容
						yield dataContent as unknown as T;
					}
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}
