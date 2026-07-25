import { fetcher } from "../../network";
import { parseSSE } from "../../network/parse-sse";
import { getModelName } from "../helper";
import type { AI } from "../types";
import type { ChatCompletions } from "./types";
import {
	checkUnsupportedInput,
	detachToolArguments,
	executeToolCall,
	extractReasoning,
	extractTextContent,
} from "./utils";

export type { ChatCompletions } from "./types";

const nonStreaming = async (
	api: ReturnType<typeof fetcher>,
	messages: AI.Message[],
	tools: AI.ToolDefinition[] = [],
	options?: Pick<ChatCompletions.Options, "onToolHandled">,
): Promise<ChatCompletions.NonStreamResult> => {
	const { onToolHandled } = options ?? {};

	// 循环请求，直到模型回复用户
	while (true) {
		const response = await api.post<ChatCompletions.NonStreamResponse>(
			"/chat/completions",
			{},
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
		const reasoning = extractReasoning(message);

		// 调用工具
		if (toolCalls.length > 0 && tools.length > 0) {
			for (const toolCall of toolCalls) {
				const result = await executeToolCall(toolCall, tools, {
					messages,
				});
				messages.push({
					role: "tool",
					content: result,
					tool_call_id: toolCall.id,
				});
				onToolHandled?.(
					toolCall.function.name,
					toolCall.function.arguments,
					result,
				);
			}
			continue;
		}

		// 如果没有工具要调用了，则结束本轮对话
		return {
			content: extractTextContent(content),
			reasoning,
			usage,
			...restResponse,
			...restMessage,
		};
	}
};

const streaming = async function* (
	api: ReturnType<typeof fetcher>,
	messages: AI.Message[],
	tools: AI.ToolDefinition[] = [],
	options?: Pick<ChatCompletions.Options, "onToolHandled">,
): AsyncGenerator<ChatCompletions.StreamChunk> {
	const { onToolHandled } = options ?? {};

	// 不断请求直到大模型确定回复
	while (true) {
		const toolCallsAcc = new Map<number, AI.ToolCall>();
		let fullContent = "";
		let finishReason: string | null = null;
		let usage: ChatCompletions.Usage | undefined;

		// 用parser拿到原始Response，使用parseSSE逐行读取
		const response = await api.post<Response>(
			"/chat/completions",
			{ stream: true },
			{
				parser: async (res) => res,
			},
		);

		// 拼接content
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

			const reasoning = extractReasoning(delta);
			if (reasoning) {
				yield { reasoning };
			}

			if (content) {
				fullContent += content;
				yield { content };
			}

			// 流式传输的toolCall需要先拼接
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
			finishReason === "tool_calls" &&
			toolCalls.length > 0 &&
			tools.length > 0
		) {
			messages.push({
				role: "assistant",
				content: fullContent,
				tool_calls: toolCalls,
			});

			for (const toolCall of toolCalls) {
				const result = await executeToolCall(toolCall, tools, {
					messages,
				});
				messages.push({
					role: "tool",
					content: result,
					tool_call_id: toolCall.id,
				});
				onToolHandled?.(
					toolCall.function.name,
					toolCall.function.arguments,
					result,
				);
			}

			// 继续while循环
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
 * 兼容OpenAI API的聊天补全函数（流式模式）
 * - 自动处理工具调用
 * - 传入 `stream: true` 时返回异步迭代器，逐块产出内容与 usage
 *
 * @param model 模型配置，包含model、baseUrl、apiKey
 * @param messages OpenAI API兼容的消息数组
 * @param options 额外参数，须包含 `stream: true`，也可含 tools、temperature 等
 * @returns 异步迭代器，逐块产出 `{ content?, reasoning?, usage? }`
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
	model: AI.Model,
	messages: AI.Message[],
	options: ChatCompletions.Options & {
		stream: true;
	},
): Promise<AsyncGenerator<ChatCompletions.StreamChunk>>;
/**
 * 兼容OpenAI API的聊天补全函数（普通模式）
 * - 自动处理工具调用
 * - 默认返回完整结果，非流式
 *
 * @param model 模型配置，包含model、baseUrl、apiKey
 * @param messages OpenAI API兼容的消息数组
 * @param options 可选的额外参数，如tools、temperature等
 * @returns `{ content, usage, ... }` 完整结果
 *
 * @example
 * // 最简调用
 * // 未填写模型名，会自动使用/v1/models返回的第一个模型
 * const { reasoning, content, usage } = await chatCompletions(
 *   { baseUrl: "http://127.0.0.1:11434/v1" },
 *   [{ role: "user", content: "你好" }],
 * );
 * console.log(reasoning); // "The user said..."
 * console.log(content); // "你好！有什么我可以帮你的吗？"
 * console.log(usage);   // { prompt_tokens: [redacted], completion_tokens: [redacted], total_tokens: [redacted] }
 *
 * @example
 * // 工具调用
 * const { content, usage } = await chatCompletions(
 *   { baseUrl: "http://127.0.0.1:11434/v1", model: "model.gguf", apiKey: "sk-loc**********-key" },
 *   [{ role: "user", content: "查询上海天气" }],
 *   {
 *     tools: [{
 *       type: "function",
 *       function: {
 *         name: "getWeather",
 *         description: "查询城市天气情况",
 *         parameters: { type: "object", properties: { city: { type: "string" } } },
 *         handler: (args) => `${args.city}今日晴转多云，25°C`,
 *       },
 *     }],
 *   },
 * );
 */
export function chatCompletions(
	model: AI.Model,
	messages: AI.Message[],
	options?: ChatCompletions.Options,
): Promise<ChatCompletions.NonStreamResult>;
export async function chatCompletions(
	model: AI.Model,
	messages: AI.Message[],
	options?: ChatCompletions.Options,
) {
	const {
		baseUrl,
		apiKey = "",
		model: modelName,
		customBody,
		inputs,
		...restModelConfig
	} = model;

	const { stream, tools = [], ...restOptions } = options ?? {};

	// 检查上下文是否含有模型不支持的消息类型
	const unsupportedInput = checkUnsupportedInput(model, messages);
	if (unsupportedInput) {
		throw new Error(`当前上下文含有模型不支持的输入类型：${unsupportedInput}`);
	}

	// 组装请求头
	const api = fetcher(baseUrl, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		body: {
			model: modelName ?? (await getModelName(baseUrl)),
			messages,
			tools: tools?.map((tool) => detachToolArguments(tool)[0]),
			...customBody,
		},
	});

	const fn = stream ? streaming : nonStreaming;

	return fn(api, messages, tools, {
		...restOptions,
		...restModelConfig,
	});
}
