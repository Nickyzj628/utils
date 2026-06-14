import type { fetcher } from "../../network";
import { extractErrorMessage } from "../../string";
import type { ChatCompletions } from "./types";

/**
 * 从 /models 获取模型名称
 */
export const getModelName = async (
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
 * 执行工具调用
 */
export const executeToolCall = async (
	toolCall: ChatCompletions.ToolCall,
	toolHandlers: ChatCompletions.ToolHandlers,
	extraArgs?: ChatCompletions.ExtraArgs,
): Promise<string> => {
	const handler = toolHandlers[toolCall.function.name];
	if (!handler) {
		return `没有找到工具“${toolCall.function.name}”的处理函数`;
	}

	try {
		const args = JSON.parse(toolCall.function.arguments);
		const result = await handler(args, extraArgs);
		return typeof result === "string" ? result : JSON.stringify(result);
	} catch (error) {
		// 需要在宿主代码中自行处理异常时，可以让 error name 和 tool name 保持一致
		if (error instanceof Error && error.name === toolCall.function.name) {
			throw error;
		}
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
