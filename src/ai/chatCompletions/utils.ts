import { fetcher } from "../../network";
import { extractErrorMessage } from "../../string";
import type { ChatCompletions } from "./types";

/**
 * 从 /models 获取模型名称
 */
const getModelName = async (
	api: ReturnType<typeof fetcher>,
): Promise<string> => {
	const res = await api.get<{ data: Array<{ id: string }> }>("/models");
	const modelName = res.data[0]?.id;
	if (!modelName) {
		throw new Error("无法从 /models 获取模型名称");
	}
	return modelName;
};

/**
 * 发送聊天补全请求
 */
export const request = async (
	model: ChatCompletions.Model,
	messages: ChatCompletions.Message[],
	extraBody: Omit<ChatCompletions.ExtraBody, "toolHandlers"> = {},
): Promise<ChatCompletions.Response> => {
	const { model: modelName, baseUrl: baseUrl, apiKey = "" } = model;

	const api = fetcher(baseUrl, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	const resolvedModelName = modelName ?? (await getModelName(api));

	const body = {
		model: resolvedModelName,
		messages,
		...extraBody,
	};

	return api.post<ChatCompletions.Response>("/chat/completions", body);
};

/**
 * 发送流式聊天补全请求，返回 OpenAI 原始 SSE 数据块的异步迭代器
 */
export const requestStream = async function* (
	model: ChatCompletions.Model,
	messages: ChatCompletions.Message[],
	extraBody: Omit<ChatCompletions.ExtraBody, "toolHandlers" | "stream"> = {},
): AsyncGenerator<ChatCompletions.StreamResponse> {
	const { model: modelName, baseUrl: baseUrl, apiKey = "" } = model;

	const api = fetcher(baseUrl, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	const resolvedModelName = modelName ?? (await getModelName(api));

	const body = {
		model: resolvedModelName,
		messages,
		...extraBody,
		stream: true,
		stream_options: {
			include_usage: true,
			...(extraBody.stream_options ?? {}),
		},
	};

	// 用 parser 拿到原始 Response，自行读取 body 流
	const response = await api.post<Response>("/chat/completions", body, {
		parser: async (res) => res,
	});

	if (!response.body) {
		throw new Error("响应没有 body，无法读取流式数据");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith("data:")) {
					continue;
				}
				const data = trimmed.slice(5).trim();
				if (data === "[DONE]") {
					return;
				}
				try {
					yield JSON.parse(data);
				} catch {
					// 忽略解析失败的行
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
};

/**
 * 执行工具调用
 */
export const executeToolCall = async (
	toolCall: ChatCompletions.ToolCall,
	toolHandlers: Record<string, (args: any) => any | Promise<any>>,
): Promise<string> => {
	const handler = toolHandlers[toolCall.function.name];
	if (!handler) {
		return `没有找到工具“${toolCall.function.name}”的处理函数`;
	}

	try {
		const args = JSON.parse(toolCall.function.arguments);
		const result = await handler(args);
		return typeof result === "string" ? result : JSON.stringify(result);
	} catch (error) {
		return `工具“${toolCall.function.name}”处理失败：${extractErrorMessage(error)}`;
	}
};

/**
 * 从 Message.content 中提取文本内容
 */
export const extractTextContent = (
	content: ChatCompletions.Message["content"],
) => {
	if (typeof content === "string") {
		return content;
	}

	return content
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n");
};
