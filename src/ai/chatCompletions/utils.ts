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
 * 执行工具调用
 */
export const executeToolCall = async (
	toolCall: AI.ToolCall,
	toolDefinitions: AI.ToolDefinition[],
	extraArgs?: Record<string, any>,
): Promise<string> => {
	const handler = toolDefinitions.find(
		(tool) => tool.function.name === toolCall.function.name,
	)?.handler;

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
 * 从消息中提取模型的思考内容。不同供应商，即使都有OpenAI API Compatible接口，它们输出的思考内容字段也不同，例如：
 * - OpenRouter里的思考字段为reasoning
 * - 火山引擎的是reasoning_content
 */
export const extractReasoning = (message: AI.Message) => {
	return message.reasoning || (message.reasoning_content as string);
};

/**
 * 从Message.content中提取文本内容
 */
export const extractTextContent = (content: AI.Message["content"]) => {
	if (typeof content === "string") {
		return content;
	}

	return content
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n");
};

/**
 * Message.content.type => AI.inputs
 */
const contentPartToInputType = (
	part: AI.ContentPart,
): AI.InputType | undefined => {
	switch (part.type) {
		case "text":
			return "text";
		case "image_url":
			return "image";
		case "input_audio":
			return "audio";
		case "video_url":
			return "video";
	}
};

/**
 * 检查上下文中是否含有模型不支持的消息类型
 */
export const checkHasUnsupportedInput = (model: AI.Model, messages: AI.Message[]) => {
	const { inputs = ["text"] } = model;

	return messages.some((message) => {
		const { content } = message;
		// 应该没有模型不支持文字消息吧？
		if (typeof content === "string") {
			return;
		}
		// 检查多模态消息
		if (Array.isArray(content)) {
			for (const part of content) {
				const type = contentPartToInputType(part);
				// 解析不出的消息类型 / 模型不支持的消息 => true(不支持)
				return !type || !inputs.includes(type);
			}
		}
		// 兜底
		return true;
	});
};