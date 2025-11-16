/**
 * 简易 LRU 缓存
 * @example
 * const cache = new LRUCache<string, number>(2);
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.set("c", 3);    // 缓存已满，a 被淘汰
 * cache.get("a");    // undefined
 */
declare class LRUCache<K, V> {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    has(key: K): boolean;
}
export default LRUCache;
