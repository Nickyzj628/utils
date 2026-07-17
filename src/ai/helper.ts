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
export const defineModel = (config: AI.Model): AI.Model => config;

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
