/**
 * 节流函数 - 在指定时间间隔内最多执行一次调用
 * @param fn 要节流的函数
 * @param delay 间隔时间，默认 300ms
 *
 * @remarks
 * 节流：连续触发时，按照固定间隔执行。适合用于滚动、拖拽等高频触发场景。
 * 例如：滚动页面时，每300ms最多执行一次回调，而不是每次滚动都执行。
 *
 * 防抖 vs 节流：
 * - 防抖：等待触发停止后才执行（最后一次）
 * - 节流：按固定节奏执行（每隔多久执行一次）
 *
 * @example
 * const handleScroll = throttle(() => {
 *   console.log('滚动位置:', window.scrollY);
 * }, 200);
 * window.addEventListener('scroll', handleScroll);
 */
export const throttle = <T extends (...args: any[]) => any>(
	fn: T,
	delay = 300,
) => {
	let timer: ReturnType<typeof setTimeout> | null = null;

	return function (this: any, ...args: Parameters<T>) {
		if (!timer) {
			timer = setTimeout(() => {
				timer = null;
				fn.apply(this, args);
			}, delay);
		}
	};
};
