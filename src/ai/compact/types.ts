import type { AI } from "../types";

export namespace Compact {
	export type ReplacerOfToolResultContent = (
		content: AI.Message["content"],
	) => AI.Message["content"];

	export type ReplacerOfMediaContent = (
		content: AI.Message["content"],
	) => AI.Message["content"];

	export type SummarizeOptions = {
		/** 不总结最新的X%条消息 */
		keepPercent: number;
		/** 用什么模型总结 */
		model: AI.Model;
		/** 用于指导大模型如何总结消息的提示词 */
		systemPrompt: string;
	};
}
