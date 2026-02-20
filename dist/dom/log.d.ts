/**
 * log 配置选项
 */
export interface LogOptions {
    /**
     * 是否显示时间
     * @default true
     */
    time?: boolean;
    /**
     * 是否显示调用者文件名
     * @default true
     */
    fileName?: boolean;
}
/**
 * 带额外信息的 console.log
 * @param message - 日志消息，支持单条消息或消息数组
 * @param options - 配置选项
 *
 * @example
 * log("调试信息"); // "[14:30:00] [index.ts:15] 调试信息"
 * log("调试信息", { time: false }); // "[index.ts:15] 调试信息"
 * log("调试信息", { fileName: false }); // "[14:30:00] 调试信息"
 * log("调试信息", { time: false, fileName: false }); // "调试信息"
 * log(["消息1", "消息2"]); // "[14:30:00] [index.ts:15] 消息1 消息2"
 */
export declare const log: (message: any | any[], options?: LogOptions) => void;
