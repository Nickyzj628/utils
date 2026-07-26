import { logger } from "../../dom";
import { to } from "../../network";
import { createXMLText } from "../../string";
import { type ChatCompletions, chatCompletions } from "../chatCompletions";
import { estimateTokens } from "../helper";
import type { AI } from "../types";
import type { Compact } from "./types";
import {
	alignToolGroupBoundary,
	hasToolCalls,
	isSummarizableMessage,
} from "./utils";

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
	const { model, keepCount, systemPrompt } = options ?? {};

	// 保留最近keepCount条消息不做总结
	let endIndex = messages.length - keepCount;

	// 消息太少时不需要总结
	if (endIndex <= 0) {
		logger("消息太少，无需总结");
		return;
	}

	// 对齐配对组边界，避免拆散assistant(tool_calls) + tool
	endIndex = alignToolGroupBoundary(messages, endIndex);

	// 收集可以被总结的消息
	// - 跳过系统消息
	// - 跳过content含有第三方XML标签的消息（允许纯文本、<summary>标签、多模态消息）
	// - 跳过倒数keepCount条消息
	const summarizableIndices: number[] = [];
	const summarizingMessages: AI.Message[] = [];
	for (let i = 0; i < endIndex; i++) {
		const message = messages[i];
		if (!message) {
			continue;
		}

		// assistant(tool_calls) + tool配对组需整体可总结，避免拆散导致API 400
		if (hasToolCalls(message)) {
			let j = i + 1;
			while (j < endIndex && messages[j]?.role === "tool") {
				j++;
			}
			const group = messages.slice(i, j);
			if (group.every(isSummarizableMessage)) {
				for (let k = i; k < j; k++) {
					summarizableIndices.push(k);
				}
				summarizingMessages.push(...group);
			}
			i = j - 1;
			continue;
		}

		// 跳过孤立的tool消息（已由配对组逻辑处理）
		if (message.role === "tool") {
			continue;
		}

		if (isSummarizableMessage(message)) {
			summarizableIndices.push(i);
			summarizingMessages.push(message);
		}
	}

	if (summarizableIndices.length === 0) {
		logger("没有可总结的消息");
		return;
	}

	summarizingMessages.push(
		{ role: "system", content: systemPrompt },
		{ role: "user", content: "开始总结上下文" },
	);

	const [error, summarized] = await to(
		chatCompletions(model, summarizingMessages),
	);
	if (error) {
		logger(`总结失败：${error.message}`);
		return;
	}

	// 替换原始消息数组中被总结的消息
	// 从后往前删除以避免索引偏移，在首个被总结消息的位置插入摘要
	const firstIndex = summarizableIndices[0] ?? 0;
	for (let i = summarizableIndices.length - 1; i >= 0; i--) {
		const index = summarizableIndices[i];
		if (index !== undefined) {
			messages.splice(index, 1);
		}
	}
	messages.splice(firstIndex, 0, {
		role: "user",
		content: createXMLText("summary", summarized.content),
	});
};

const hardDeleteOldMessages = (messages: AI.Message[], keepCount: number) => {
	// 从第一条user消息开始
	const startIndex = messages.findIndex((message) => message.role === "user");
	// 保留最近keepCount条消息
	let endIndex = messages.length - keepCount;

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
		ratioToCompactToolResult?: number;
		/**
		 * 如何压缩工具调用结果，例如让其他模型返回精简后的工具结果
		 * @default (content) => "（已被消费）"
		 */
		replacerOfToolResultContent?: Compact.ReplacerOfToolResultContent;

		/**
		 * 上下文>总上下文*ratio时压缩图片/音频/视频消息
		 * @default 0.7
		 */
		ratioToCompactMedia?: number;
		/**
		 * 如何压缩媒体消息，例如让其他模型用自然语言简短描述一遍
		 * @default (content) => "（已被丢弃）"
		 */
		replacerOfMediaContent?: Compact.ReplacerOfMediaContent;

		/**
		 * 上下文>总上下文*ratio时总结消息
		 * @default 0.8
		 * @remarks 如果总结成功，会把summarizeOptions.keepCount(默认10)以前的消息压成一条消息；如果总结失败，会采取兜底压缩方法：硬删除summarizeOptions.keepCount以前的消息
		 */
		ratioToSummarize?: number;
		/**
		 * 总结消息时的配置项
		 * @default { keepCount: 10, model: undefined, systemPrompt: "总结历史消息" }
		 */
		summarizeOptions?: Partial<Compact.SummarizeOptions>;
	},
) => {
	const {
		usage,

		ratioToCompactToolResult = 0.6,
		replacerOfToolResultContent = () => "已被消费",

		ratioToCompactMedia = 0.7,
		replacerOfMediaContent = () => "已被丢弃",

		ratioToSummarize = 0.8,
		summarizeOptions,
	} = options ?? {};
	const context = model?.context ?? 128000;
	const tokens = usage?.total_tokens ?? estimateTokens(messages);

	// 上下文 > 总上下文*60% => 压缩工具调用结果
	if (tokens > context * ratioToCompactToolResult) {
		softDeleteToolResults(messages, replacerOfToolResultContent);
	}

	// 上下文 > 总上下文*70% => 压缩图片/音频/视频消息
	if (tokens > context * ratioToCompactMedia) {
		softDeleteOldMediaMessages(messages, replacerOfMediaContent);
	}

	// 上下文 > 总上下文*80% => 总结消息
	if (tokens > context * ratioToSummarize) {
		const { keepCount = 10, systemPrompt = "总结历史消息" } =
			summarizeOptions ?? {};

		const [error] = await to(
			summarizeMessages(messages, { model, keepCount, systemPrompt }),
		);
		if (!error) {
			// summarize已经总结足够多的消息，无需兜底
			return;
		}

		// 作为兜底，硬删除较早的消息
		hardDeleteOldMessages(messages, keepCount);
	}
};
