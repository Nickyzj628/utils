import { logger } from "../../dom";
import { to } from "../../network";
import { type ChatCompletions, chatCompletions } from "../chatCompletions";
import { estimateTokens } from "../helper";
import type { AI } from "../types";
import type { Compact } from "./types";
import { alignToolGroupBoundary } from "./utils";

export type { Compact } from "./types";

const softDeleteToolResults = (
	messages: AI.Message[],
	replacer: Compact.ReplacerOfToolResultContent,
) => {
	const deletedCount = messages.reduce((result, message) => {
		if (message.role === "tool") {
			message.content = replacer(message.content);
			result++;
		}
		return result;
	}, 0);

	if (deletedCount > 0) {
		logger(`软删除了${deletedCount}条工具调用结果消息`);
	}
};

const softDeleteOldMediaMessages = (
	messages: AI.Message[],
	replacer: Compact.ReplacerOfMediaContent,
) => {
	const mediaTypes = ["image_url", "input_audio", "video_url"];

	const deletedCount = messages.reduce((result, message) => {
		if (
			Array.isArray(message.content) &&
			message.content.some((part) => mediaTypes.includes(part.type))
		) {
			message.content = replacer(message.content);
			result++;
		}
		return result;
	}, 0);

	if (deletedCount > 0) {
		logger(`软删除了${deletedCount}条旧图片/音频/视频消息`);
	}
};

const summarizeMessages = async (
	messages: AI.Message[],
	options: Compact.SummarizeOptions,
) => {
	const { model, keepPercent, systemPrompt } = options ?? {};

	// 从第一条用户消息开始总结
	const startIndex = messages.findIndex((message) => message.role === "user");
	// 保留最近的消息
	const keepRecentCount = Math.ceil(messages.length * keepPercent);
	let endIndex = messages.length - keepRecentCount;

	// 消息太少时不需要总结
	if (endIndex <= startIndex) {
		logger("消息太少，无需总结");
		return false;
	}

	// 对齐配对组边界，避免拆散 assistant(tool_calls) + tool
	endIndex = alignToolGroupBoundary(messages, endIndex);

	const summarizingMessages = messages.slice(startIndex, endIndex);
	summarizingMessages.push(
		{ role: "system", content: systemPrompt },
		{ role: "user", content: "开始总结上下文" },
	);

	const [error, summarized] = await to(
		chatCompletions(model, summarizingMessages),
	);
	if (error) {
		logger(`总结失败：${error.message}`);
		return false;
	}

	// 替换原始消息数组中被总结的消息
	messages.splice(startIndex, endIndex - startIndex, {
		role: "user",
		content: `<summary>\n${summarized.content}\n</summary>`,
	});
};

const hardDeleteOldMessages = (messages: AI.Message[], keepPercent: number) => {
	// 从第一条user消息开始
	const startIndex = messages.findIndex((message) => message.role === "user");
	// 保留最近的消息
	const keepRecentCount = Math.ceil(messages.length * keepPercent);
	let endIndex = messages.length - keepRecentCount;

	// 消息太少，没有可删除的余量
	if (endIndex <= startIndex) {
		logger("消息太少，无需硬删除");
		return;
	}

	// 对齐配对组边界，避免拆散assistant(tool_calls) + tool
	endIndex = alignToolGroupBoundary(messages, endIndex);

	const deletedCount = endIndex - startIndex;
	messages.splice(startIndex, deletedCount);
	logger(`硬删除了${deletedCount}条较早的消息`);
};

/**
 * 自动优化上下文，类似AI Coding Agent的/compact命令
 */
export const compactMessages = async (
	messages: AI.Message[],
	model: AI.Model,
	options?: {
		/** 提供token消耗情况时，能更准确地判断上下文是否达到阈值 */
		usage?: ChatCompletions.Usage;

		/**
		 * 上下文>总上下文*ratio时压缩工具调用结果
		 * @default 0.6
		 */
		ratioOfCompactToolResult?: number;
		/**
		 * 如何压缩工具调用结果，例如让其他模型返回精简后的工具结果
		 * @default (content) => "（已被消费）"
		 */
		replacerOfToolResultContent?: Compact.ReplacerOfToolResultContent;

		/**
		 * 上下文>总上下文*ratio时压缩图片/音频/视频消息
		 * @default 0.7
		 */
		ratioOfCompactMedia?: number;
		/**
		 * 如何压缩媒体消息，例如让其他模型用自然语言简短描述一遍
		 * @default (content) => "（已被丢弃）"
		 */
		replacerOfMediaContent?: Compact.ReplacerOfMediaContent;

		/**
		 * 上下文>总上下文*ratio时总结消息
		 * @default 0.8
		 * @remarks 如果总结成功，会把summarizeOptions.keepPercent(默认0.2(20%))以外的消息压成一条消息；如果总结失败，会采取兜底压缩方法：硬删除summarizeOptions.keepPercent以外的消息
		 */
		ratioOfSummarize?: number;
		/**
		 * 总结消息时的配置项
		 * @default { keepPercent: 0.2, model: undefined, systemPrompt: "总结历史消息" }
		 */
		summarizeOptions?: Partial<Compact.SummarizeOptions>;
	},
) => {
	const {
		usage,

		ratioOfCompactToolResult = 0.6,
		replacerOfToolResultContent = () => "已被消费",

		ratioOfCompactMedia = 0.7,
		replacerOfMediaContent = () => "已被丢弃",

		ratioOfSummarize = 0.8,
		summarizeOptions,
	} = options ?? {};
	const context = model?.context ?? 128000;
	const tokens = usage?.total_tokens ?? estimateTokens(messages);

	// 上下文 > 总上下文*60% => 压缩工具调用结果
	if (tokens > context * ratioOfCompactToolResult) {
		softDeleteToolResults(messages, replacerOfToolResultContent);
	}

	// 上下文 > 总上下文*70% => 压缩图片/音频/视频消息
	if (tokens > context * ratioOfCompactMedia) {
		softDeleteOldMediaMessages(messages, replacerOfMediaContent);
	}

	// 上下文 > 总上下文*80% => 总结消息
	if (tokens > context * ratioOfSummarize) {
		const { keepPercent = 0.2, systemPrompt = "总结历史消息" } =
			summarizeOptions ?? {};

		const [error] = await to(
			summarizeMessages(messages, { model, keepPercent, systemPrompt }),
		);
		if (!error) {
			// summarize已经总结足够多的消息，无需兜底
			return;
		}

		// 作为兜底，硬删除较早的消息
		hardDeleteOldMessages(messages, keepPercent);
	}
};
