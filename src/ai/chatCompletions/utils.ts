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
	const { model: modelName, baseURL, apiKey = "" } = model;

	const api = fetcher(baseURL, {
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
