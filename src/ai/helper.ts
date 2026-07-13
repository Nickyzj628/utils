import type { ChatCompletions } from "./chatCompletions";

/**
 * 辅助定义一个/chat/completions支持的模型传参，除了必须的baseUrl，还可传入：
 * - apiKey：线上模型必传的密钥，本地llama.cpp、vllm等后端可以不传
 * - model：模型代码（如deepseek-v4-flash），不传则会使用{baseUrl}/models接口的第一个模型
 */
export const defineModel = (
	config: ChatCompletions.Model,
): ChatCompletions.Model => config;

export const defineTool = (config: ChatCompletions.ToolDefinition) => {

};
