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
	// 传入的messages是顶层切分后的"可压缩区"（已排除倒数keepCount条），全量处理即可
	// 注意：软删除只替换content不删除消息，不会拆散assistant(tool_calls) + tool配对组
	let deletedCount = 0;
	for (const message of messages) {
		if (message?.role === "tool") {
			message.content = replacer(message.content);
			deletedCount++;
		}
	}

	if (deletedCount > 0) {
		logger(`软删除了${deletedCount}条工具调用结果消息`);
	}
};

const softDeleteOldMediaMessages = (
	messages: AI.Message[],
	replacer: Compact.ReplacerOfMediaContent,
) => {
	const mediaTypes = ["image_url", "input_audio", "video_url"];

	// 传入的messages是顶层切分后的"可压缩区"（已排除倒数keepCount条），全量处理即可
	let deletedCount = 0;
	for (const message of messages) {
		if (
			message &&
			Array.isArray(message.content) &&
			message.content.some((part) => mediaTypes.includes(part.type))
		) {
			message.content = replacer(message.content);
			deletedCount++;
		}
	}

	if (deletedCount > 0) {
		logger(`软删除了${deletedCount}条旧图片/音频/视频消息`);
	}
};

const summarizeMessages = async (
	messages: AI.Message[],
	options: Compact.SummarizeOptions,
) => {
	const { model, systemPrompt } = options ?? {};

	// 传入的messages是顶层切分后的"可压缩区"（已排除倒数keepCount条，
	// 且切点已由alignToolGroupBoundary对齐），无需再计算边界

	// 消息太少时不需要总结
	if (messages.length === 0) {
		logger("消息太少，无需总结");
		return;
	}

	// 收集可以被总结的消息
	// - 跳过系统消息
	// - 跳过content含有第三方XML标签的消息（允许纯文本、<summary>标签、多模态消息）
	const summarizableIndices: number[] = [];
	const summarizingMessages: AI.Message[] = [];
	for (let i = 0; i < messages.length; i++) {
		const message = messages[i];
		if (!message) {
			continue;
		}

		// assistant(tool_calls) + tool配对组需整体可总结，避免拆散导致API 400
		if (hasToolCalls(message)) {
			let j = i + 1;
			while (j < messages.length && messages[j]?.role === "tool") {
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

	const summarized = await chatCompletions(model, summarizingMessages);

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

const hardDeleteOldMessages = (messages: AI.Message[]) => {
	// 传入的messages是顶层切分后的"可压缩区"（已排除倒数keepCount条）
	// 从第一条user消息开始删除，保留开头的system消息
	const startIndex = messages.findIndex((message) => message.role === "user");

	// 压缩区里没有user消息时，没有可删除的余量
	if (startIndex < 0) {
		logger("消息太少，无需硬删除");
		return;
	}

	const deletedCount = messages.length - startIndex;
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
		 * 各种压缩方式统一保留的最近消息条数
		 * @default 10
		 * @remarks 压缩工具调用结果、压缩媒体消息、总结消息、硬删除兜底都会保留最近keepCount条消息不处理
		 */
		keepCount?: number;

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
		 * @remarks 如果总结成功，会把keepCount(默认10，见顶层选项)以前的消息压成一条消息；如果总结失败，会采取兜底压缩方法：硬删除keepCount以前的消息
		 */
		ratioToSummarize?: number;
		/**
		 * 总结消息时的配置项
		 * @default { model: undefined, systemPrompt: "总结历史消息" }
		 */
		summarizeOptions?: Partial<Compact.SummarizeOptions>;
	},
): Promise<Compact.CompactResult> => {
	const {
		usage,

		keepCount = 10,

		ratioToCompactToolResult = 0.6,
		replacerOfToolResultContent = () => "（工具结果已消费）",

		ratioToCompactMedia = 0.7,
		replacerOfMediaContent = () => "（消息已过期）",

		ratioToSummarize = 0.8,
		summarizeOptions,
	} = options ?? {};
	const context = model?.context ?? 131072;
	const tokens = usage?.total_tokens ?? estimateTokens(messages);

	const result: Compact.CompactResult = {
		hasCompactedToolResult: false,
		hasCompactedMedia: false,
		hasSummarized: false,
		hasDeletedOldMessages: false,
	};

	// 顶层只做一次keepCount切分，内部各压缩方式只处理"可压缩区"，无需各自关心keepCount：
	// - compressible：前段可压缩区，所有压缩方式只作用于这部分
	// - reserved：倒数keepCount条保留区，原样保留
	// 切点先用alignToolGroupBoundary对齐，避免拆散assistant(tool_calls) + tool配对组
	let endIndex = Math.max(0, messages.length - keepCount);
	endIndex = alignToolGroupBoundary(messages, endIndex);
	const compressible = messages.slice(0, endIndex);
	const reserved = messages.slice(endIndex);

	// 上下文 > 总上下文*60% => 压缩工具调用结果
	if (tokens > context * ratioToCompactToolResult) {
		softDeleteToolResults(compressible, replacerOfToolResultContent);
		result.hasCompactedToolResult = true;
	}

	// 上下文 > 总上下文*70% => 压缩图片/音频/视频消息
	if (tokens > context * ratioToCompactMedia) {
		softDeleteOldMediaMessages(compressible, replacerOfMediaContent);
		result.hasCompactedMedia = true;
	}

	// 上下文 > 总上下文*80% => 总结消息
	if (tokens > context * ratioToSummarize) {
		const { systemPrompt = "总结历史消息" } = summarizeOptions ?? {};

		const [error] = await to(
			summarizeMessages(compressible, { model, systemPrompt }),
		);
		result.hasSummarized = true;
		if (error) {
			// 总结失败，作为兜底硬删除压缩区较早的消息
			logger(`总结失败（${error.message}），改用硬删除兜底`);
			hardDeleteOldMessages(compressible);
			result.hasDeletedOldMessages = true;
		}

		// 总结/硬删除会改变压缩区的长度，需把处理后的压缩区+保留区合并回原数组
		// （软删除只改content，对象引用共享，无需重组）
		messages.splice(0, messages.length, ...compressible, ...reserved);
	}

	return result;
};
