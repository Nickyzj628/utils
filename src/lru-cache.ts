/**
 * 简易 LRU 缓存
 * @example
 * const cache = new LRUCache<string, number>(2);
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.set("c", 3);    // 缓存已满，a 被淘汰
 * cache.get("a");    // undefined
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize = 10) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (!value) {
      return undefined;
    }
    // 重置缓存顺序
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V) {
    // 刷新缓存
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 删除最旧的缓存
    else if (this.cache.size >= this.maxSize) {
      const oldestKey = [...this.cache.keys()][0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K) {
    return this.cache.has(key);
  }
}

export default LRUCache;
