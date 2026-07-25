import { hasXmlTags } from "../../string";
import type { AI } from "../types";

/**
 * 判断消息是否可被总结
 * @remarks
 * - 跳过系统消息
 * - 跳过content含有第三方XML标签的消息（允许纯文本、`<summary>`标签、多模态消息）
 */
export const isSummarizableMessage = (message: AI.Message): boolean => {
	if (message.role === "system") {
		return false;
	}

	let text: string;
	if (typeof message.content === "string") {
		text = message.content;
	} else if (Array.isArray(message.content)) {
		// 多模态消息：仅提取文本部分用于检测XML标签，非文本部分（图片/音频/视频）不影响判断
		text = message.content
			.filter((part): part is AI.TextContent => part.type === "text")
			.map((part) => part.text)
			.join("");
	} else {
		return false;
	}

	return !hasXmlTags(text, ["summary"]);
};

/**
 * 判断消息是否为带有工具调用的 assistant 消息
 */
export const hasToolCalls = (message: AI.Message | undefined) =>
	message?.role === "assistant" && Array.isArray(message.tool_calls);

/**
 * 调整切点 endIndex，确保它不会落在 assistant(tool_calls) + tool 配对组中间
 * @param messages 完整消息数组
 * @param endIndex 初始切点，会把消息分为 [, endIndex) 和 [endIndex, ) 两段
 * @returns 调整后的 endIndex，保证切点不会拆散配对组
 * @remarks OpenAI API 要求 assistant(tool_calls) 和 tool 消息通过 tool_call_id 一一配对。
 * 如果切点落在配对组中间，两段消息都会出现孤立消息，导致 API 返回 400
 */
export const alignToolGroupBoundary = (
	messages: AI.Message[],
	endIndex: number,
) => {
	endIndex = Math.min(endIndex, messages.length);

	// 切点处第一条保留消息是tool -> 其对应的assistant在被切掉的一侧，
	// 将连续的tool都推入被切掉一侧，使整组配对留在同一段
	while (messages[endIndex]?.role === "tool") {
		endIndex++;
	}

	return endIndex;
};
