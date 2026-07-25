import type { AI } from "../types";

/**
 * 判断消息是否为带有工具调用的 assistant 消息
 */
export const hasToolCalls = (message: AI.Message | undefined) =>
	message?.role === "assistant" && Array.isArray(message.tool_calls);

/**
 * 调整切点 endIndex，确保它不会落在 assistant(tool_calls) + tool 配对组中间
 * @param messages 完整消息数组
 * @param endIndex 初始切点，会把消息分为 [, endIndex) 和 [endIndex, ) 两段
 * @returns 调整后的 endIndex，保证切点两侧都不出现孤立的 assistant(tool_calls) 或 tool 消息
 * @remarks OpenAI API 要求 assistant(tool_calls) 和 tool 消息通过 tool_call_id 一一配对。
 * 如果切点落在配对组中间，两段消息都会出现孤立消息，导致 API 返回 400
 */
export const alignToolGroupBoundary = (
	messages: AI.Message[],
	endIndex: number,
) => {
	// 确保 endIndex 不超出消息范围
	endIndex = Math.min(endIndex, messages.length);

	// 情况 1：被切掉部分的最后一条是带 tool_calls 的 assistant，
	// 但紧接着保留部分的开头不是对应的 tool 消息 —— assistant 被孤立
	if (
		hasToolCalls(messages[endIndex - 1]) &&
		messages[endIndex]?.role !== "tool"
	) {
		// 把这条 assistant 也纳入保留部分
		endIndex--;
	}

	// 情况 2：保留部分的第一条是 tool 消息，
	// 但被切掉部分的最后一条不是对应的 assistant(tool_calls) -- tool 被孤立
	// 注意：assistant 一次发起多个 tool_calls 时会连续产生多条 tool 响应，
	// 若切点落在这一组中间，会同时孤立多条 tool，单次 if 无法处理，必须用 while
	while (
		messages[endIndex]?.role === "tool" &&
		!hasToolCalls(messages[endIndex - 1])
	) {
		// 把切点后移，使这条 tool 推入被切掉一侧，与前序消息一起被总结/删除
		endIndex++;
	}

	return endIndex;
};
