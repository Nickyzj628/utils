/**
 * log 配置选项
 */
interface LogOptions {
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
declare const log: (message: any | any[], options?: LogOptions) => void;

/**
 * 循环执行函数，直到符合停止条件
 *
 * @example
 * // 循环请求大语言模型，直到其不再调用工具
 * loopUntil(
 *   async () => {
 *     const completion = await chatCompletions();
 *     completion.tool_calls?.forEach(chooseAndHandleTool)
 *     return completion;
 *   },
 *   {
 *     shouldStop: (completion) => !completion.tool_calls,
 *   },
 * ),
 *
 * @example
 * // 不传递 shouldStop，执行 3 次后正常返回最后结果
 * loopUntil(
 *   () => {
 *     return doSomething();
 *   },
 *   {
 *     maxRetries: 3,
 *   },
 * ),
 */
declare const loopUntil: <T>(fn: (count: number) => T | Promise<T>, options?: {
    /**
     * 最大循环次数
     * @default 5
     */
    maxRetries?: number;
    /** 停止循环条件。如果未传递，则执行 maxRetries 次后退出并返回最后结果 */
    shouldStop?: (result: T) => boolean;
}) => Promise<T>;

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
declare const withCache: <Args extends any[], Result>(fn: (this: {
    setTtl: SetTtl;
}, ...args: Args) => Result, ttlSeconds?: number) => {
    (...args: Args): Result;
    clear(): void;
    updateTtl(seconds: number): void;
};

type Falsy = false | 0 | -0 | 0n | "" | null | undefined;
/**
 * 检测传入的值是否为**假值**（false、0、''、null、undefined、NaN等）
 *
 * @example
 * isFalsy(""); // true
 * isFalsy(1); // false
 */
declare const isFalsy: (value: any) => value is Falsy;

/**
 * 检测传入的值是否为**空值**（null、undefined）
 *
 * @example
 * isNil(null); // true
 * isNil(undefined); // true
 * isNil(1); // false
 */
declare const isNil: (value: any) => value is null | undefined;

/**
 * 检测传入的值是否为**普通对象**
 *
 * @example
 * const obj = { a: 1 };
 * isObject(obj); // true
 */
declare const isObject: (value: any) => value is Record<string, any>;

type Primitive = number | string | boolean | symbol | bigint | undefined | null;
/**
 * 检测传入的值是否为**原始值**（number、string、boolean、symbol、bigint、undefined、null）
 *
 * @example
 * isPrimitive(1);  // true
 * isPrimitive([]); // false
 */
declare const isPrimitive: (value: any) => value is Primitive;

type FetchOptions = {
    /** 代理服务器配置 */
    proxy?: string;
};
type RequestInit = globalThis.RequestInit & FetchOptions & {
    params?: Record<string, any>;
    parser?: (response: Response) => Promise<any>;
};
/**
 * 基于 Fetch API 的请求客户端
 * @param baseURL 接口前缀
 * @param baseOptions 客户端级别的请求体，后续调用时传递相同参数会覆盖上去
 *
 * @remarks
 * 特性：
 * - 合并实例、调用时的相同请求体
 * - 在 params 里传递对象，自动转换为 queryString
 * - 在 body 里传递对象，自动 JSON.stringify
 * - 可选择使用 to() 转换请求结果为 [Error, Response]
 * - 可选择使用 withCache() 缓存请求结果
 * - 支持 proxy 选项
 *
 * @example
 *
 * // 用法1：直接发送请求
 * const res = await fetcher().get<Blog>("https://nickyzj.run:3030/blogs/hello-world");
 *
 * // 用法2：创建实例
 * const api = fetcher("https://nickyzj.run:3030", { headers: { Authorization: "Bearer token" } });
 * const res = await api.get<Blog>("/blogs/hello-world", { headers: {...}, params: { page: 1 } });  // 与实例相同的 headers 会覆盖上去，params 会转成 ?page=1 跟到 url 后面
 *
 * // 用法3：使用代理
 * const api = fetcher("https://api.example.com", {
 *   proxy: "http://127.0.0.1:7890"
 * });
 *
 * // 安全处理请求结果
 * const [error, data] = await to(api.get<Blog>("/blogs/hello-world"));
 * if (error) {
 *   console.error(error);
 *   return;
 * }
 * console.log(data);
 *
 * // 缓存请求结果
 * const getBlogs = withCache(api.get);
 * await getBlogs("/blogs");
 * await sleep();
 * await getBlogs("/blogs");  // 不发请求，使用缓存
 */
declare const fetcher: (baseURL?: string, baseOptions?: RequestInit) => {
    get: <T>(url: string, options?: Omit<RequestInit, "method">) => Promise<T>;
    post: <T>(url: string, body: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
    put: <T>(url: string, body: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
    delete: <T>(url: string, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
};

/** 从 url 响应头获取真实链接 */
declare const getRealURL: (originURL: string) => Promise<string>;

/**
 * 图片压缩选项
 */
type ImageCompressionOptions = {
    /** 压缩比率，默认 0.92 */
    quality?: number;
    /**
     * 自定义压缩函数，用于覆盖默认压缩行为
     * @param arrayBuffer 图片的 ArrayBuffer 数据
     * @param mime 图片的 MIME 类型
     * @param quality 压缩质量
     * @returns 压缩后的 base64 字符串
     */
    compressor?: (arrayBuffer: ArrayBuffer, mime: string, quality: number) => Promise<string> | string;
    /**
     * 自定义 fetch 函数，用于使用自己封装的请求库读取图片
     * 必须返回符合 Web 标准的 Response 对象
     * @param url 图片地址
     * @returns Promise<Response>
     */
    fetcher?: (url: string) => Promise<Response>;
};
/**
 * 图片地址转 base64 数据
 *
 * @param imageUrl 图片地址
 * @param options 可选配置
 * @param options.quality 压缩比率，默认 0.92
 * @param options.compressor 自定义压缩函数，用于覆盖默认压缩行为
 *
 * @example
 * // 基本用法（浏览器自动使用 Canvas 压缩，Node.js 自动检测并使用 sharp）
 * imageUrlToBase64("https://example.com/image.jpg");
 *
 * @example
 * // 使用自定义 fetch 函数（如 axios 封装）
 * imageUrlToBase64("https://example.com/image.jpg", {
 *   fetcher: async (url) => {
 *     // 使用 axios 或其他请求库，但必须返回 Response 对象
 *     const response = await axios.get(url, { responseType: 'arraybuffer' });
 *     return new Response(response.data, {
 *       status: response.status,
 *       statusText: response.statusText,
 *       headers: response.headers
 *     });
 *   }
 * });
 *
 * @example
 * // 使用自定义压缩函数覆盖默认行为
 * imageUrlToBase64("https://example.com/image.jpg", {
 *   quality: 0.8,
 *   compressor: async (buffer, mime, quality) => {
 *     // 自定义压缩逻辑
 *     return `data:${mime};base64,...`;
 *   }
 * });
 */
declare const imageUrlToBase64: (imageUrl: string, options?: ImageCompressionOptions) => Promise<string>;

/**
 * Go 语言风格的异步处理方式
 * @param promise 一个能被 await 的异步函数
 * @returns 如果成功，返回 [null, 异步函数结果]，否则返回 [Error, undefined]
 *
 * @example
 * const [error, response] = await to(fetcher().get<Blog>("/blogs/hello-world"));
 */
declare const to: <T, E = Error>(promise: Promise<T>) => Promise<[null, T] | [E, undefined]>;

/**
 * 在指定闭区间内生成随机整数
 *
 * @example
 * randomInt(1, 10);    // 1 <= x <= 10
 */
declare const randomInt: (min: number, max: number) => number;

type DeepMapKeys<T> = T extends Array<infer U> ? Array<DeepMapKeys<U>> : T extends object ? {
    [key: string]: DeepMapKeys<T[keyof T]>;
} : T;
/**
 * 递归处理对象里的 key
 *
 * @remarks
 * 无法完整推导出类型，只能做到有递归，key 全为 string，value 为同层级的所有类型的联合
 *
 * @template T 要转换的对象
 *
 * @example
 * const obj = { a: { b: 1 } };
 * const result = mapKeys(obj, (key) => key.toUpperCase());
 * console.log(result); // { A: { B: 1 } }
 */
declare const mapKeys: <T>(obj: T, getNewKey: (key: string) => string) => DeepMapKeys<T>;

type DeepMapValues<T, R> = T extends Array<infer U> ? Array<DeepMapValues<U, R>> : T extends object ? {
    [K in keyof T]: T[K] extends object ? DeepMapValues<T[K], R> : R;
} : R;
/**
 * 递归处理对象里的 value
 *
 * @remarks
 * 无法完整推导出类型，所有 value 最终都会变为 any
 *
 * @template T 要转换的对象
 * @template R 转换后的值类型，为 any，无法进一步推导
 *
 * @example
 * const obj = { a: 1, b: { c: 2 } };
 * const result = mapValues(obj, (value, key) => isPrimitive(value) ? value + 1 : value);
 * console.log(result); // { a: 2, b: { c: 3 } }
 */
declare const mapValues: <T, R = any>(obj: T, getNewValue: (value: any, key: string | number) => R, options?: {
    /** 过滤函数，返回 true 表示保留该字段 */
    filter?: (value: any, key: string | number) => boolean;
}) => DeepMapValues<T, R>;

/**
 * 深度合并两个对象，规则如下：
 * 1. 原始值覆盖：如果两个值都是原始类型，则用后者覆盖;
 * 2. 数组拼接：如果两个值都是数组，则拼接为大数组；
 * 3. 对象递归合并：如果两个值都是对象，则进行递归深度合并；
 *
 * @template T 第一个对象
 * @template U 第二个对象
 * @param {T} obj1 要合并的第一个对象，相同字段会被 obj2 覆盖
 * @param {U} obj2 要合并的第二个对象
 */
declare const mergeObjects: <T extends Record<string, any>, U extends Record<string, any>>(obj1: T, obj2: U) => T & U;

type SnakeToCamel<S extends string> = S extends `${infer Before}_${infer After}` ? After extends `${infer First}${infer Rest}` ? `${Before}${Uppercase<First>}${SnakeToCamel<Rest>}` : Before : S;
/**
 * 下划线命名法转为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // "userName"
 */
declare const snakeToCamel: <S extends string>(str: S) => SnakeToCamel<S>;
type CamelToSnake<S extends string> = S extends `${infer First}${infer Rest}` ? Rest extends Uncapitalize<Rest> ? `${Lowercase<First>}${CamelToSnake<Rest>}` : `${Lowercase<First>}_${CamelToSnake<Rest>}` : Lowercase<S>;
/**
 * 驼峰命名法转为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // "should_component_update"
 */
declare const camelToSnake: <S extends string>(str: S) => CamelToSnake<S>;
type Capitalize<S extends string> = S extends `${infer P1}${infer Rest}` ? P1 extends Capitalize<P1> ? S : `${Uppercase<P1>}${Rest}` : S;
/**
 * 字符串首字母大写
 *
 * @example
 * capitalize("hello") // "Hello"
 */
declare const capitalize: <S extends string>(s: S) => Capitalize<S>;
type Decapitalize<S extends string> = S extends `${infer P1}${infer Rest}` ? P1 extends Lowercase<P1> ? P1 : `${Lowercase<P1>}${Rest}` : S;
/**
 * 字符串首字母小写
 *
 * @example
 * decapitalize("Hello") // "hello"
 */
declare const decapitalize: <S extends string>(s: S) => Decapitalize<S>;

/**
 * 将字符串压缩为单行精简格式
 *
 * @example
 * // "Hello, world."
 * compactStr(`
 *   Hello,
 *        world!
 * `, {
 *  disableNewLineReplace: false,
 * });
 */
declare const compactStr: (text?: string, options?: {
    /** 最大保留长度，设为 0 或 Infinity 则不截断，默认 Infinity */
    maxLength?: number;
    /** 是否将换行符替换为字面量 \n，默认开启 */
    disableNewLineReplace?: boolean;
    /** 是否合并连续的空格/制表符为一个空格，默认开启 */
    disableWhitespaceCollapse?: boolean;
    /** 截断后的后缀，默认为 "..." */
    omission?: string;
}) => string;

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
declare const debounce: <T extends (...args: any[]) => any>(fn: T, delay?: number) => (...args: Parameters<T>) => void;

/**
 * 延迟一段时间再执行后续代码
 * @param time 延迟时间，默认 150ms
 * @example
 * await sleep(1000); // 等待 1 秒执行后续代码
 */
declare const sleep: (time?: number) => Promise<unknown>;

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
declare const throttle: <T extends (...args: any[]) => any>(fn: T, delay?: number) => (this: any, ...args: Parameters<T>) => void;

export { type CamelToSnake, type Capitalize, type Decapitalize, type DeepMapKeys, type DeepMapValues, type Falsy, type FetchOptions, type ImageCompressionOptions, type LogOptions, type Primitive, type RequestInit, type SetTtl, type SnakeToCamel, camelToSnake, capitalize, compactStr, debounce, decapitalize, fetcher, getRealURL, imageUrlToBase64, isFalsy, isNil, isObject, isPrimitive, log, loopUntil, mapKeys, mapValues, mergeObjects, randomInt, sleep, snakeToCamel, throttle, to, withCache };
