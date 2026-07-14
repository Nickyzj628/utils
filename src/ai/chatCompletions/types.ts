import type { AI } from "../types";

export namespace ChatCompletions {
	/** 非流式POST /chat/completions的响应结果 */
	export type NonStreamResponse = {
		id: string;
		object: "chat.completion";
		created: number;
		model: string;
		choices: Array<{
			index: number;
			message: AI.Message;
			finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
		}>;
		usage: Usage;
		system_fingerprint?: string;
	};

	/** 调用chatCompletions返回的结果，流式/非流式通用 */
	export type NonStreamResult = {
		/** 模型的最终回复内容（多模态时取所有text拼接） */
		content: string;
		/** Token 消耗情况 */
		usage: Usage;
		/** 原始响应中的其他字段 */
		[key: string]: any;
	};

	export type Usage = {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};

	/** 流式响应中的单个SSE数据块（OpenAI原始格式） */
	export type StreamResponse = {
		id: string;
		object: "chat.completion.chunk";
		created: number;
		model: string;
		choices: Array<{
			index: number;
			delta: Pick<AI.Message, "role" | "reasoning" | "content"> & {
				tool_calls?: Array<{ index: number } & Partial<AI.ToolCall>>;
			};
			finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
		}>;
		usage?: Usage;
	};

	/** 流式调用chatCompletions时迭代器产出的数据块 */
	export type StreamChunk = {
		/** 模型流式返回的思考内容增量（仅在生成过程中出现） */
		reasoning?: string;
		/** 模型流式返回的内容增量（仅在生成过程中出现） */
		content?: string;
		/** Token 消耗情况（仅在最后一帧出现） */
		usage?: Usage;
	};
}
