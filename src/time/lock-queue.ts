/**
 * 排队锁
 *
 * @remarks
 * 使用场景如：同时给大模型发送多条消息，使其依次回复
 *
 * @example
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
 */
export class LockQueue {
	queue: Promise<any>;

	constructor() {
		this.queue = Promise.resolve();
	}

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
