import type { AI } from "./types";

/**
 * 辅助定义一个POST /chat/completions支持的model参数
 * @remarks 只有baseUrl字段是必须的，其他字段请查看AI.Model类型
 */
export const defineModel = (
	config: AI.Model,
): AI.Model => config;

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
	const _properties = Object.entries(properties).reduce((result, [key, value]) => {
		// 收集required的字段名
		if ("required" in value) {
			_required.push(value.required);
			delete value.required;
		}
		result[key] = value;
		return result;
	}, {} as AI.ToolDefinition["function"]["parameters"]["properties"]);

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
