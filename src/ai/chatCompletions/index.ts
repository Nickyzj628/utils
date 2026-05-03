import type { ChatCompletions } from "./types";
import { executeToolCall, request } from "./utils";

/** 从 Message.content 中提取文本内容 */
const extractTextContent = (content: ChatCompletions.Message["content"]) => {
	if (typeof content === "string") {
		return content;
	}

	return content
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n");
};

/**
 * 兼容 OpenAI API 的聊天补全函数
 * - 自动处理工具调用
 * - 返回最终回复内容和 token 消耗情况
 *
 * @param model 模型配置，包含 model、baseURL、apiKey
 * @param messages OpenAI API 兼容的消息数组
 * @param extraBody 可选的额外参数，如 tools、toolHandlers、temperature 等
 * @returns 包含 content、usage 和其他原始字段的对象
 *
 * @example
 * // 最简调用
 * // 未填写模型名，会自动使用/v1/models的第一个模型
 * const { content, usage } = await chatCompletions(
 *   { baseURL: "http://127.0.0.1:11434/v1" },
 *   [{ role: "user", content: "你好" }],
 * );
 * console.log(content); // "你好！有什么我可以帮你的吗？"
 * console.log(usage);   // { prompt_tokens: 13, completion_tokens: 9, total_tokens: 22 }
 *
 * @example
 * // 工具调用
 * const { content, usage } = await chatCompletions(
 *   { baseURL: "http://127.0.0.1:11434/v1", model: "model.gguf", apiKey: "sk-local-no-need-key" },
 *   [{ role: "user", content: "查询上海天气" }],
 *   {
 *     tools: [{
 *       type: "function",
 *       function: {
 *         name: "getWeather",
 *         description: "查询城市天气情况",
 *         parameters: { type: "object", properties: { city: { type: "string" } } },
 *       },
 *     }],
 *     toolHandlers: {
 *       getWeather: (args) => `${args.city}今日晴转多云，25°C`,
 *     },
 *   },
 * );
 */
export const chatCompletions = async (
	model: ChatCompletions.Model,
	messages: ChatCompletions.Message[],
	extraBody: ChatCompletions.ExtraBody = {},
): Promise<ChatCompletions.Result> => {
	const { toolHandlers = {}, ...restExtraBody } = extraBody;

	// 循环请求，直到模型回复用户
	while (true) {
		const response = await request(model, messages, restExtraBody);

		const { choices, usage, ...restResponse } = response;
		const { message } = choices[0] ?? {};
		if (!message) {
			throw new Error("模型没有回复任何内容");
		}

		const {
			content = "",
			tool_calls: toolCalls = [],
			...restMessage
		} = message;

		messages.push(message);

		// 响应模型的工具调用请求
		if (toolCalls.length > 0 && Object.keys(toolHandlers).length > 0) {
			for (const toolCall of toolCalls) {
				const result = await executeToolCall(toolCall, toolHandlers);
				messages.push({
					role: "tool",
					content: result,
					tool_call_id: toolCall.id,
				});
			}
			continue;
		}

		// 没有工具调用或不需要处理，返回最终结果
		return {
			content: extractTextContent(content),
			usage,
			...restResponse,
			...restMessage,
		};
	}
};
