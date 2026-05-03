export namespace ChatCompletions {
	export type Model = {
		/** 模型名称（如果不传，会尝试从 /models 读取模型） */
		model?: string;
		/** API 基础地址 */
		baseURL: string;
		/** API 密钥（本地模型可不传） */
		apiKey?: string;
	};

	export type TextContent = {
		type: "text";
		text: string;
	};

	export type ImageContent = {
		type: "image_url";
		image_url: {
			url: string;
		};
	};

	export type ContentPart = TextContent | ImageContent;

	export type Message = {
		role: "system" | "user" | "assistant" | "tool" | "function";
		content: string | ContentPart[];
		name?: string;
		tool_calls?: ToolCall[];
		tool_call_id?: string;
	};

	export type ToolCall = {
		id: string;
		type: "function";
		function: {
			name: string;
			arguments: string;
		};
	};

	export type ToolDefinition = {
		type: "function";
		function: {
			name: string;
			description?: string;
			parameters?: Record<string, any>;
		};
	};

	export type Usage = {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};

	export type Response = {
		id: string;
		object: "chat.completion";
		created: number;
		model: string;
		choices: Array<{
			index: number;
			message: Message;
			finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
		}>;
		usage: Usage;
		system_fingerprint?: string;
	};

	export type ExtraBody = {
		/** 工具列表 */
		tools?: ToolDefinition[];
		/** 工具调用函数表，key 为工具名，value 为函数 */
		toolHandlers?: Record<string, (args: any) => any | Promise<any>>;
		/** 其他额外参数 */
		[key: string]: any;
	};

	export type Result = {
		/** 模型的最终回复内容（多模态时取所有 text 拼接） */
		content: string;
		/** Token 消耗情况 */
		usage: Usage;
		/** 原始响应中的其他字段 */
		[key: string]: any;
	};
}
