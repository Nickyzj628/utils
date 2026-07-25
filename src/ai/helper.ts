// ================================
// 这里存放供外部使用的辅助工具
// ================================

import { fetcher } from "../network";
import { pickBy } from "../object";
import type { AI } from "./types";

/**
 * 辅助定义一个POST /chat/completions支持的model参数
 * @remarks 只有baseUrl字段是必须的，其他字段请查看AI.Model类型
 */
export const defineModel = (config: AI.Model): AI.Model => ({
	inputs: ["text"],
	context: 128000,
	...config,
});

/**
 * 辅助定义一个POST /chat/completions支持的tools中的子元素
 * @param handler 在AI请求调用工具时用到
 */
export const defineTool = (
	name: AI.ToolDefinition["function"]["name"],
	description: AI.ToolDefinition["function"]["description"],
	properties: AI.ToolDefinition["function"]["parameters"]["properties"],
	handler: AI.ToolDefinition["handler"],
): AI.ToolDefinition => {
	const _required: string[] = [];
	const _properties = pickBy(properties, (key) => {
		if (key === "required") {
			_required.push(key);
			return false;
		}
		return true;
	}) as Omit<
		AI.ToolDefinition["function"]["parameters"]["properties"],
		"required"
	>;

	return {
		type: "function",
		function: {
			name,
			description,
			parameters: {
				type: "object",
				properties: _properties,
				required: _required,
			},
		},
		handler,
	};
};

/**
 * 从GET /models获取模型名称
 */
export const getModelName = async (baseUrl: string): Promise<string> => {
	const res = await fetcher(baseUrl).get<{ data: Array<{ id: string }> }>(
		"/v1/models",
	);
	const modelName = res.data[0]?.id;
	if (!modelName) {
		throw new Error("无法从/models获取模型名称");
	}
	return modelName;
};

/**
 * 根据上下文里的中/英文/多模态消息，估算出可能消耗的token
 * - 单词 ≈ 1.5token
 * - 标点/空白等非词字符每 4 个 ≈ 1token
 * - 图片/音频/视频/文件 ≈ 10000token（不好估算，取个较大的值）
 */
export const estimateTokens = (messages?: AI.Message[]) => {
	if (!messages?.length) {
		return 0;
	}

	// 用Intl.Segmenter按词切分
	const segmenter = new Intl.Segmenter([], { granularity: "word" });
	const estimateTextTokens = (text: string) => {
		let words = 0;
		let others = 0;
		for (const seg of segmenter.segment(text)) {
			if (seg.isWordLike) words++;
			else others++;
		}
		return Math.ceil(words * 1.5 + others / 4);
	};

	const tokens = messages.reduce((acc, message) => {
		const { content, tool_calls, ...metadata } = message;

		if (typeof content === "string") {
			acc += estimateTextTokens(content);
		} else {
			for (const part of content) {
				if (part.type === "text") {
					acc += estimateTextTokens(part.text);
				} else {
					acc += 10000;
				}
			}
		}

		if (tool_calls) {
			acc += estimateTextTokens(JSON.stringify(tool_calls));
		}
		acc += estimateTextTokens(JSON.stringify(metadata));

		return acc;
	}, 0);

	return tokens;
};
