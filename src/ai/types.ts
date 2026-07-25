export namespace AI {
	export type Model = {
		// ================================
		// POST /chat/completions接受的参数
		// ================================
		baseUrl: string;
		/** 不传则自动使用{baseUrl}/models接口的第一个模型 */
		model?: string;
		apiKey?: string;
		/** POST /chat/completions时注入自定义请求体 */
		customBody?: Record<string, any>;

		// ================================
		// 可有可无的辅助配置
		// ================================
		/**
		 * 模型支持的消息输入类型
		 * @default ["text"]
		 * @remarks 会在调用chatCompletions前校验上下文，含有不支持的输入时抑制请求 */
		inputs?: InputType[];
		/**
		 * 模型的最大上下文（输入+输出）
		 * @default 128000
		 * @remarks 会在调用chatCompletions后智能调用compact（如当前上下文>最大上下文*80%时），详见chatCompletions.autoCompact配置 */
		context?: number;
	};

	export type InputType = "text" | "image" | "video" | "audio" | "file";

	export type Message = {
		role: "system" | "user" | "assistant" | "tool" | "function";
		/** OpenRouter的思考内容字段，其他供应商的会尽可能合并到该字段内 */
		reasoning?: string | null;
		content: string | ContentPart[];
		tool_calls?: ToolCall[];
		tool_call_id?: string;
		[key: string]: unknown;
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

	export type AudioContent = {
		type: "input_audio";
		input_audio: {
			/** 使用公网可访问的音频链接 */
			url?: string;
			/** 使用base64 */
			data?: string;
			format: string;
		};
	};

	export type VideoContent = {
		type: "video_url";
		video_url: {
			url: string;
		};
	};

	export type ContentPart =
		| TextContent
		| ImageContent
		| AudioContent
		| VideoContent;

	export type ToolDefinition = {
		// ================================
		// POST /chat/completions接受的参数
		// ================================
		type: "function";
		function: {
			name: string;
			description: string;
			parameters: {
				type: "object";
				properties: Record<
					string,
					{
						type: string;
						description?: string;
						/** 在此处设置的required，发出请求前会自动提到外面去 */
						required?: boolean;
					}
				>;
				required?: string[];
			};
		};

		// ================================
		// 工具的实际执行函数，chatCompletions响应AI的工具调用请求时用到
		// ================================
		handler: (...args: any) => any;
	};

	export type ToolCall = {
		id: string;
		type: "function";
		function: {
			name: string;
			arguments: string;
		};
	};
}
