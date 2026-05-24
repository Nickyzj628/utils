import { isObject } from "../is";

/**
 * logger 配置选项
 */
export interface LoggerOptions {
	/**
	 * 是否显示时间
	 * @default true
	 */
	withTime?: boolean;
	/**
	 * 是否显示调用者文件名
	 * @default true
	 */
	withFileName?: boolean;
}

function createLogger(
	options: LoggerOptions = {},
	stackOffset: number = 0,
): (...messages: any[]) => void {
	const { withTime = true, withFileName = true } = options;

	return (...messages: any[]) => {
		const parts: any[] = [];

		if (withTime) {
			parts.push(`[${new Date().toLocaleTimeString()}]`);
		}

		if (withFileName) {
			// 通过 Error stack 获取调用者位置信息
			// stack 示例：
			//   Error
			//     at createLogger返回的函数 (E:\Projects\utils\src\dom\log.ts:42:15)
			//     at 用户代码 (E:\Projects\utils\src\index.ts:137:2)
			const { stack } = new Error();

			// 定位到用户代码所在行（跳过 createLogger 返回的函数，必要时再跳过 logger 包装层）
			const callerLine = stack?.split("\n")[2 + stackOffset]?.trim();

			// 正则匹配 stack 中的文件路径和行号
			//   ^at\s+            — 匹配 "at " 前缀（trim 后无前置空格）
			//   (?:.*?\s*\()?     — 可选匹配函数名和左括号，如 "functionName (" 或 "<anonymous> ("
			//   (.*?)             — 非贪婪捕获文件路径（如 E:\...\index.ts）
			//   :(\d+)            — 捕获行号
			//   (?::(\d+))?       — 可选捕获列号（仅用于兼容，输出时不使用）
			//   \)?                — 可选匹配右括号
			const match = callerLine?.match(
				/^at\s+(?:.*?\s*\()?(.*?):(\d+)(?::(\d+))?\)?/,
			);

			if (match?.[1]) {
				// 从完整路径中提取文件名，统一处理 / 和 \ 分隔符
				const fileName = match[1].split(/[/\\]/).pop();
				parts.push(`[${fileName}:${match[2]}]`);
			}
		}

		parts.push(...messages);
		console.log(...parts);
	};
}

/**
 * 带额外信息的 console.log
 *
 * **直接调用**：使用默认选项打印消息
 * @param messages - 日志消息，支持多条
 *
 * **预配置**：先传入选项返回 logger 函数，再调用打印
 * @param options - 配置选项
 * @returns 配置后的 logger 函数
 *
 * @example
 * // 直接调用（默认显示时间和文件名）
 * logger("调试信息"); // "[14:30:00] [index.ts:15:2] 调试信息"
 * logger("消息1", "消息2"); // "[14:30:00] [index.ts:15:2] 消息1 消息2"
 *
 * // 预配置后调用
 * const myLogger = logger({ withTime: true, withFileName: true });
 * myLogger("一段消息", "另一段消息"); // "[18:59:47] [index.ts:137:2] 一段消息 另一段消息"
 *
 * // 关闭时间或文件名
 * const plainLogger = logger({ withTime: false });
 * plainLogger("纯文件名前缀"); // "[index.ts:15:2] 纯文件名前缀"
 */
export function logger(options?: LoggerOptions): (...messages: any[]) => void;
export function logger(...messages: any[]): void;
export function logger(
	first?: LoggerOptions | any,
	...rest: any[]
): ((...messages: any[]) => void) | void {
	const isOptions =
		isObject(first) && ("withTime" in first || "withFileName" in first);

	if (isOptions) {
		return createLogger(first as LoggerOptions, 0);
	}

	createLogger({}, 1)(first, ...rest);
}
