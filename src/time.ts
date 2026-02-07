/**
 * 延迟一段时间再执行后续代码
 * @param time 延迟时间，默认 150ms
 * @example
 * await sleep(1000); // 等待 1 秒执行后续代码
 */
export const sleep = async (time = 150) => {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
};

/**
 * 防抖：在指定时间内只执行最后一次调用
 * @param fn 要防抖的函数
 * @param delay 延迟时间，默认 300ms
 *
 * @remarks
 * 连续触发时，只有最后一次会执行。适合用于搜索框输入、窗口大小调整等场景。
 * 例如：用户输入"hello"过程中，不会触发搜索，只有停下来时才执行。
 *
 * 防抖 vs 节流：
 * - 防抖：等待触发停止后才执行（最后一次）
 * - 节流：按固定节奏执行（每隔多久执行一次）
 *
 * @example
 * const search = debounce((keyword: string) => {
 *   console.log('搜索:', keyword);
 * });
 * search('hello'); // 300ms 后执行
 */
export const debounce = <T extends (...args: any[]) => any>(
	fn: T,
	delay = 300,
) => {
	let timer: ReturnType<typeof setTimeout> | null = null;

	return (...args: Parameters<T>) => {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			fn(...args);
		}, delay);
	};
};

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
