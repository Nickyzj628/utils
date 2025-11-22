type SetTtl = (seconds: number) => void;
/**
 * 创建一个带缓存的高阶函数
 *
 * @template Args 被包装函数的参数类型数组
 * @template Result 被包装函数的返回类型
 *
 * @param fn 需要被缓存的函数，参数里附带的 setTtl 方法用于根据具体情况改写过期时间
 * @param ttlSeconds 以秒为单位的过期时间，-1 表示永不过期，默认 -1，会被回调函数里的 setTtl() 覆盖
 *
 * @returns 返回包装后的函数，以及缓存相关的额外方法
 *
 * @example
 * // 异步函数示例
 * const fetchData = withCache(async function (url: string) {
 *   const data = await fetch(url).then((res) => res.json());
 *   this.setTtl(data.expiresIn); // 根据实际情况调整过期时间
 *   return data;
 * });
 *
 * await fetchData(urlA);
 * await fetchData(urlA); // 使用缓存结果
 * await fetchData(urlB);
 * await fetchData(urlB); // 使用缓存结果
 *
 * fetchData.clear(); // 清除缓存
 * await fetchData(urlA); // 重新请求
 * await fetchData(urlB); // 重新请求
 *
 * // 缓存过期前
 * await sleep();
 * fetchData.updateTtl(180);  // 更新 ttl 并为所有未过期的缓存续期
 * await fetchData(urlA); // 使用缓存结果
 * await fetchData(urlB); // 使用缓存结果
 */
export declare const withCache: <Args extends any[], Result>(fn: (this: {
    setTtl: SetTtl;
}, ...args: Args) => Result, ttlSeconds?: number) => {
    (...args: Args): Result;
    clear(): void;
    updateTtl(seconds: number): void;
};
export {};
