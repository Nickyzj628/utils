/**
 * 排队锁
 *
 * @deprecated 建议改用 Web Locks API（`navigator.locks`），本类仅保留以兼容旧代码。
 *
 * 废弃原因：本实现是用 Promise 链手动编排的队列，锁的释放完全依赖调用方
 * 手动调用返回的 `release` 函数；一旦遗漏 release（例如请求抛异常后未释放），
 * 后续所有任务会永久卡死。而 Web Locks API 是浏览器原生标准，锁在回调
 * 执行结束（含抛异常）时自动释放，并自带排队、超时（`timeout`）、
 * 条件获取（`ifAvailable`）等语义，更安全、更标准。
 *
 * @remarks
 * 使用场景如：同时给大模型发送多条消息，使其依次回复
 *
 * @example
 * // ❌ 废弃用法：手动 release，容易忘记释放导致死锁
 * const queue = new LockQueue();
 * const messages = [];
 *
 * const chatCompletions = async () => {
 *  // 等待前一个队列释放
 *  const release = await queue.waitInQueue();
 *
 *  const message = await requestLLM();
 *  messages.push(message);
 *  sendMessage(message);
 *
 *  // 释放队列
 *  release();
 * };
 *
 * chatCompletions();
 * chatCompletions();
 * chatCompletions();
 *
 * @example
 * // ✅ 推荐用法：Web Locks API（需要运行环境支持 navigator.locks，
 * // 如 Chrome 69+ / Edge / Firefox 96+ / Safari 15.4+）
 * const messages = [];
 * const LOCK_NAME = "chat-completions"; // 锁名相同的请求才会互相排队
 *
 * const chatCompletions = async () => {
 *   // 回调执行完（或抛异常）时自动释放锁，无需手动 release
 *   await navigator.locks.request(LOCK_NAME, async (lock) => {
 *     const message = await requestLLM();
 *     messages.push(message);
 *     sendMessage(message);
 *   });
 * };
 *
 * chatCompletions();
 * chatCompletions();
 * chatCompletions();
 */
export class LockQueue {
	queue: Promise<any>;

	constructor() {
		this.queue = Promise.resolve();
	}

	/**
	 * 等待前一个队列释放，返回释放当前队列的函数
	 */
	waitInQueue() {
		let _resolve: (value?: any) => void;
		const nextPromise = new Promise((resolve) => {
			_resolve = resolve;
		});

		const waitPrevThenReleaseCurr = this.queue.then(() => _resolve);
		this.queue = nextPromise;

		return waitPrevThenReleaseCurr;
	}
}
