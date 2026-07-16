import { pick } from "../../object";
import { extractErrorMessage } from "../../string";
import type { AI } from "../types";

/**
 * 分离ToolDefinition中可以传给POST /chat/completions的字段，以及在本地运行不外传的字段
 * @param toolDefinition 
 * @returns [{...能传给POST /chat/completions的字段}, {...本地辅助字段}]
 */
export const detachToolArguments = (toolDefinition: AI.ToolDefinition) => {
	return [
		pick(toolDefinition, ["type", "function"]),
		pick(toolDefinition, ["handler"]),
	];
};

/**
 * 从消息中提取模型的思考内容。不同供应商，即使都有OpenAI API Compatible接口，它们输出的思考内容字段也不同，例如：
 * - OpenRouter里的思考字段为reasoning
 * - 火山引擎的是reasoning_content
 */
export const extractReasoning = (message: AI.Message) => {
	return message.reasoning || message.reasoning_content as string;
};


/**
 * 从Message.content中提取文本内容
 */
export const extractTextContent = (
	content: AI.Message["content"],
) => {
	if (typeof content === "string") {
		return content;
	}

	return content
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n");
};

/**
 * 执行工具调用
 */
export const executeToolCall = async (
	toolCall: AI.ToolCall,
	toolDefinitions: AI.ToolDefinition[],
	extraArgs?: Record<string, any>,
): Promise<string> => {
	const { handler } = toolDefinitions.find((tool) => tool.function.name === toolCall.function.name) ?? {};
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
