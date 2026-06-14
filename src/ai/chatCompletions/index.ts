import { fetcher } from "../../network";
import { parseSSE } from "../../network/parse-sse";
import type { ChatCompletions } from "./types";
import { executeToolCall, extractTextContent, getModelName } from "./utils";

export type { ChatCompletions } from "./types";

const nonStreaming = async (
	model: ChatCompletions.Model,
	messages: ChatCompletions.Message[],
	toolHandlers: Record<string, (args: any) => any | Promise<any>>,
	restExtraBody: Omit<ChatCompletions.ExtraBody, "toolHandlers" | "stream">,
): Promise<ChatCompletions.Result> => {
	const { baseUrl, apiKey = "", model: modelName } = model;

	const api = fetcher(baseUrl, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	const body = {
		model: modelName ?? (await getModelName(api)),
		messages,
		...restExtraBody,
	};

	// 循环请求，直到模型回复用户
	while (true) {
		const response = await api.post<ChatCompletions.Response>(
			"/chat/completions",
			body,
		);

		const { choices, usage, ...restResponse } = response;
		const { message } = choices?.[0] ?? {};
		if (!message) {
			throw new Error("模型没有回复任何内容");
		}
		messages.push(message);

		const {
			content = "",
			tool_calls: toolCalls = [],
			...restMessage
		} = message;

		const reasoningContent =
			restMessage?.reasoning_content || restMessage?.reasoning;

		// 调用工具
		if (toolCalls.length > 0 && Object.keys(toolHandlers).length > 0) {
			for (const toolCall of toolCalls) {
				const result = await executeToolCall(toolCall, toolHandlers, {
					messages,
				});
				messages.push({
					role: "tool",
					content: result,
					tool_call_id: toolCall.id,
				});
			}
			continue;
		}

		// 如果没有工具要调用了，则结束本轮对话
		return {
			content: extractTextContent(content),
			reasoningContent,
			usage,
			...restResponse,
			...restMessage,
		};
	}
};

const streaming = async function* (
	model: ChatCompletions.Model,
	messages: ChatCompletions.Message[],
	toolHandlers: Record<string, (args: any) => any | Promise<any>>,
	restExtraBody: Omit<ChatCompletions.ExtraBody, "toolHandlers" | "stream">,
): AsyncGenerator<ChatCompletions.StreamChunk> {
	const { baseUrl, apiKey = "", model: modelName } = model;

	const api = fetcher(baseUrl, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	const body = {
		model: modelName ?? (await getModelName(api)),
		messages,
		stream: true,
		...restExtraBody,
	};

	// 不断请求直到大模型确定回复
	while (true) {
		const toolCallsAcc = new Map<number, ChatCompletions.ToolCall>();
		let fullContent = "";
		let finishReason: string | null = null;
		let usage: ChatCompletions.Usage | undefined;

		// 用 parser 拿到原始 Response，使用 pareSSE 逐行读取
		const response = await api.post<Response>("/chat/completions", body, {
			parser: async (res) => res,
		});

		// 拼接 content
		for await (const chunk of parseSSE(response)) {
			if (chunk.usage) {
				usage = chunk.usage;
			}

			const choice = chunk.choices?.[0];
			if (!choice) {
				continue;
			}

			const { delta } = choice;
			const { content, tool_calls: toolCalls } = delta;

			const reasoningContent = delta.reasoning_content || delta.reasoning;
			if (reasoningContent) {
				yield { reasoningContent };
			}

			if (content) {
				fullContent += content;
				yield { content };
			}

			// 流式传输的 toolCall 需要拼接
			if (toolCalls) {
				for (const toolCall of toolCalls) {
					const existing = toolCallsAcc.get(toolCall.index) ?? {
						id: "",
						type: "function" as const,
						function: { name: "", arguments: "" },
					};
					if (toolCall.id) {
						existing.id = toolCall.id;
					}
					if (toolCall.function?.name) {
						existing.function.name += toolCall.function.name;
					}
					if (toolCall.function?.arguments) {
						existing.function.arguments += toolCall.function.arguments;
					}
					toolCallsAcc.set(toolCall.index, existing);
				}
			}

			if (choice.finish_reason) {
				finishReason = choice.finish_reason;
			}
		}

		// 调用工具
		const toolCalls = Array.from(toolCallsAcc.values());
		if (
			finishReason !== "tool_calls" &&
			toolCalls.length > 0 &&
			Object.keys(toolHandlers).length > 0
		) {
			messages.push({
				role: "assistant",
				content: fullContent,
				tool_calls: toolCalls,
			});

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

		// 如果没有工具要调用了，则结束本轮对话
		messages.push({
			role: "assistant",
			content: fullContent,
		});
		if (usage) {
			yield { usage };
		}
		break;
	}
};

/**
 * 兼容 OpenAI API 的聊天补全函数
 * - 自动处理工具调用
 * - 同时支持普通响应和流式响应
 *
 * @param model 模型配置，包含 model、baseUrl、apiKey
 * @param messages OpenAI API 兼容的消息数组
 * @param extraBody 可选的额外参数，如 tools、toolHandlers、temperature、stream 等
 * @returns 普通模式下返回 `{ content, usage, ... }`；`stream: true` 时返回异步迭代器
 *
 * @example
 * // 最简调用
 * // 未填写模型名，会自动使用/v1/models的第一个模型
 * const { content, usage } = await chatCompletions(
 *   { baseUrl: "http://127.0.0.1:11434/v1" },
 *   [{ role: "user", content: "你好" }],
 * );
 * console.log(content); // "你好！有什么我可以帮你的吗？"
 * console.log(usage);   // { prompt_tokens: 13, completion_tokens: 9, total_tokens: 22 }
 *
 * @example
 * // 工具调用
 * const { content, usage } = await chatCompletions(
 *   { baseUrl: "http://127.0.0.1:11434/v1", model: "model.gguf", apiKey: "sk-local-no-need-key" },
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
 *
 * @example
 * // 流式传输
 * const result = await chatCompletions(
 *   { baseUrl: "http://127.0.0.1:11434/v1" },
 *   [{ role: "user", content: "你好" }],
 *   { stream: true },
 * );
 * for await (const { content, usage } of result) {
 *   if (content) {
 *     console.log("流式传输中：", content);
 *   } else if (usage) {
 *     console.log("对话结束，消耗：", usage);
 *   }
 * }
 */
export function chatCompletions(
	model: ChatCompletions.Model,
	messages: ChatCompletions.Message[],
	extraBody: ChatCompletions.ExtraBody & { stream: true },
): Promise<AsyncGenerator<ChatCompletions.StreamChunk>>;
export function chatCompletions(
	model: ChatCompletions.Model,
	messages: ChatCompletions.Message[],
	extraBody?: ChatCompletions.ExtraBody,
): Promise<ChatCompletions.Result>;
export async function chatCompletions(
	model: ChatCompletions.Model,
	messages: ChatCompletions.Message[],
	extraBody: ChatCompletions.ExtraBody = {},
) {
	const { stream, toolHandlers = {}, ...restExtraBody } = extraBody;
	const fn = stream ? streaming : nonStreaming;

	return fn(model, messages, toolHandlers, restExtraBody);
}

/**
 * 辅助定义一个 chatCompletions 支持的模型配置
 */
export const defineModel = (
	config: ChatCompletions.Model,
): ChatCompletions.Model => config;
