type SetTtl = (seconds: number) => void;

type CacheEntry = {
  value: any;
  expiresAt: number; // 时间戳（毫秒）
};

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
 * const fetchData = withCache(async (setTtl, url: string) => {
 *   const data = await fetch(url).then((res) => res.json());
 *   setTtl(data.expiresIn);  // 根据实际情况调整过期时间
 *   return data;
 * });
 *
 * await fetchData(urlA);
 * await fetchData(urlA); // 使用缓存结果

 * await fetchData(urlB);
 * await fetchData(urlB); // 使用缓存结果
 *
 * fetchData.clear(); // urlA 和 urlB 的缓存都被清除
 * await fetchData(urlA); // 重新请求数据
 * await fetchData(urlB); // 重新请求数据
 *
 * // 缓存过期前
 * fetchData.updateTtl(180);  // 更新 ttl 并为所有未过期缓存续期
 * await fetchData(urlA); // 使用缓存结果
 * await fetchData(urlB); // 使用缓存结果
 */
export const withCache = <Args extends any[], Result>(
  fn: (setTtl: SetTtl, ...args: Args) => Result,
  ttlSeconds = -1,
) => {
  const cache = new Map<string, CacheEntry>();

  const wrapped = (...args: Args): Result => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const entry = cache.get(key);
    // 命中缓存且未过期
    if (entry && now < entry.expiresAt) {
      return entry.value;
    }

    const setTtl: SetTtl = (seconds) => (ttlSeconds = seconds);
    const expiresAt = ttlSeconds === -1 ? Infinity : now + ttlSeconds * 1000;
    const result = fn(setTtl, ...args);

    // 异步函数：缓存 Promise 的 resolved 值
    if (result instanceof Promise) {
      const promise = result.then((resolved) => {
        cache.set(key, {
          value: resolved,
          expiresAt,
        });
        return resolved;
      });

      // 将 promise 先塞进去避免重复请求
      cache.set(key, {
        value: promise,
        expiresAt,
      });

      return promise as Result;
    }

    // 同步函数缓存
    cache.set(key, {
      value: result,
      expiresAt,
    });

    return result;
  };

  /** 手动清除缓存 */
  wrapped.clear = () => cache.clear();

  /** 更新 TTL，同时刷新所有未过期缓存的时间 */
  wrapped.updateTtl = (seconds: number) => {
    // 更新默认 TTL
    ttlSeconds = seconds;

    // 给未过期缓存续期
    const now = Date.now();
    const newExpiresAt = now + seconds * 1000;
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt > now) {
        entry.expiresAt = newExpiresAt;
        cache.set(key, entry);
      }
    }
  };

  return wrapped;
};
