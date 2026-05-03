//#region src/ai/chatCompletions/types.d.ts
declare namespace ChatCompletions {
  type Model = {
    /** 模型名称（如果不传，会尝试从 /models 读取模型） */model?: string; /** API 基础地址 */
    baseURL: string; /** API 密钥（本地模型可不传） */
    apiKey?: string;
  };
  type TextContent = {
    type: "text";
    text: string;
  };
  type ImageContent = {
    type: "image_url";
    image_url: {
      url: string;
    };
  };
  type ContentPart = TextContent | ImageContent;
  type Message = {
    role: "system" | "user" | "assistant" | "tool" | "function";
    content: string | ContentPart[];
    name?: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
  };
  type ToolCall = {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  };
  type ToolDefinition = {
    type: "function";
    function: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  };
  type Usage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  type Response = {
    id: string;
    object: "chat.completion";
    created: number;
    model: string;
    choices: Array<{
      index: number;
      message: Message;
      finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
    }>;
    usage: Usage;
    system_fingerprint?: string;
  };
  type ExtraBody = {
    /** 工具列表 */tools?: ToolDefinition[]; /** 工具调用函数表，key 为工具名，value 为函数 */
    toolHandlers?: Record<string, (args: any) => any | Promise<any>>; /** 是否使用流式传输，启用后函数返回异步迭代器 */
    stream?: boolean; /** 其他额外参数 */
    [key: string]: any;
  };
  type Result = {
    /** 模型的最终回复内容（多模态时取所有 text 拼接） */content: string; /** Token 消耗情况 */
    usage: Usage; /** 原始响应中的其他字段 */
    [key: string]: any;
  };
  /** 流式响应中的单个 SSE 数据块（OpenAI 原始格式） */
  type StreamResponse = {
    id: string;
    object: "chat.completion.chunk";
    created: number;
    model: string;
    choices: Array<{
      index: number;
      delta: {
        role?: Message["role"];
        content?: string | null;
        tool_calls?: Array<{
          index: number;
          id?: string;
          type?: "function";
          function?: {
            name?: string;
            arguments?: string;
          };
        }>;
      };
      finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
    }>;
    usage?: Usage;
  };
  /** 流式调用 chatCompletions 时迭代器产出的数据块 */
  type StreamChunk = {
    /** 模型流式返回的内容增量（仅在生成过程中出现） */content?: string; /** Token 消耗情况（仅在最后一帧出现） */
    usage?: Usage;
  };
}
//#endregion
//#region src/ai/chatCompletions/index.d.ts
/**
 * 兼容 OpenAI API 的聊天补全函数
 * - 自动处理工具调用
 * - 同时支持普通响应和流式响应
 *
 * @param model 模型配置，包含 model、baseURL、apiKey
 * @param messages OpenAI API 兼容的消息数组
 * @param extraBody 可选的额外参数，如 tools、toolHandlers、temperature、stream 等
 * @returns 普通模式下返回 `{ content, usage, ... }`；`stream: true` 时返回异步迭代器
 *
 * @example
 * // 最简调用
 * // 未填写模型名，会自动使用/v1/models的第一个模型
 * const { content, usage } = await chatCompletions(
 *   { baseURL: "http://127.0.0.1:11434/v1" },
 *   [{ role: "user", content: "你好" }],
 * );
 * console.log(content); // "你好！有什么我可以帮你的吗？"
 * console.log(usage);   // { prompt_tokens: 13, completion_tokens: 9, total_tokens: 22 }
 *
 * @example
 * // 工具调用
 * const { content, usage } = await chatCompletions(
 *   { baseURL: "http://127.0.0.1:11434/v1", model: "model.gguf", apiKey: "sk-local-no-need-key" },
 *   [{ role: "user", content: "查询上海天气" }],
 *   {
 *     tools: [{
 *       type: "function",
 *       function: {
 *         name: "getWeather",
 *         description: "查询城市天气情况",
 *         parameters: { type: "object", properties: { city: { type: "string" } } },
 *       },
 *     }],
 *     toolHandlers: {
 *       getWeather: (args) => `${args.city}今日晴转多云，25°C`,
 *     },
 *   },
 * );
 *
 * @example
 * // 流式传输
 * const result = await chatCompletions(
 *   { baseURL: "http://127.0.0.1:11434/v1" },
 *   [{ role: "user", content: "你好" }],
 *   { stream: true },
 * );
 * for await (const { content, usage } of result) {
 *   if (content) {
 *     console.log("流式传输中：", content);
 *   } else if (usage) {
 *     console.log("对话结束，消耗：", usage);
 *   }
 * }
 */
declare function chatCompletions(model: ChatCompletions.Model, messages: ChatCompletions.Message[], extraBody: ChatCompletions.ExtraBody & {
  stream: true;
}): Promise<AsyncGenerator<ChatCompletions.StreamChunk>>;
declare function chatCompletions(model: ChatCompletions.Model, messages: ChatCompletions.Message[], extraBody?: ChatCompletions.ExtraBody): Promise<ChatCompletions.Result>;
//#endregion
//#region src/dom/log.d.ts
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
//#endregion
//#region src/function/loop-until.d.ts
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
  maxRetries?: number; /** 停止循环条件。如果未传递，则执行 maxRetries 次后退出并返回最后结果 */
  shouldStop?: (result: T) => boolean;
}) => Promise<T>;
//#endregion
//#region src/hoc/with-cache.d.ts
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
//#endregion
//#region src/is/is-nil.d.ts
/**
 * 检测传入的值是否为**空值**（null、undefined）
 *
 * @example
 * isNil(null); // true
 * isNil(undefined); // true
 * isNil(1); // false
 */
declare const isNil: (value: any) => value is null | undefined;
//#endregion
//#region src/is/is-object.d.ts
/**
 * 检测传入的值是否为**普通对象**
 *
 * @example
 * const obj = { a: 1 };
 * isObject(obj); // true
 */
declare const isObject: (value: any) => value is Record<string, any>;
//#endregion
//#region src/is/is-primitive.d.ts
type Primitive = number | string | boolean | symbol | bigint | undefined | null;
/**
 * 检测传入的值是否为**原始值**（number、string、boolean、symbol、bigint、undefined、null）
 *
 * @example
 * isPrimitive(1);  // true
 * isPrimitive([]); // false
 */
declare const isPrimitive: (value: any) => value is Primitive;
//#endregion
//#region src/network/fetcher.d.ts
type RequestInit = globalThis.RequestInit & {
  /**
   * searchParams 查询参数对象
   */
  params?: Record<string, any>;
  /**
   * 响应解析器，默认的解析方法为 response.json()
   */
  parser?: (response: Response) => Promise<any>;
};
/**
 * 基于 Fetch API 的请求实例
 * @param baseURL 接口前缀
 * @param baseOptions 应用于整个实例的请求体，后续请求都会带上
 *
 * @remarks
 * 特性：
 * - 支持在创建实例、发出请求时合并相同的请求体（后者覆盖前者）
 * - 支持在 GET 的 params 请求体中传递对象
 * - 支持在 POST、PUT 的 body 请求体中传递对象
 * - 可选 to() 函数转换请求结果为 [Error, Response]
 * - 可选 withCache() 函数缓存请求结果
 *
 * @example
 * // 直接发请求
 * const res = await fetcher().get<Blog>("https://nickyzj.run:3030/blogs/hello-world", {
 *  params: {
 *    page: 2,
 *    pageSize: 10,
 *  }
 * });
 *
 * // 创建实例，发请求
 * const api = fetcher("https://nickyzj.run:3030", {
 *  headers: {
 *    Authorization: "Bearer token"
 *  }
 * });
 * const res = await api.get<Blog>("/blogs/hello-world");
 *
 * // 安全返回请求结果，不抛异常
 * const [error, data] = await to(api.get<Blog>("/blogs/hello-world"));
 * if (error) {
 *  // ...
 * }
 * // ...
 *
 * // 缓存请求结果
 * const getBlogs = withCache(api.get);
 * await getBlogs("/blogs");
 * await getBlogs("/blogs");  // 不发请求，使用缓存
 */
declare const fetcher: (baseURL?: string, baseOptions?: RequestInit) => {
  get: <T>(url: string, options?: Omit<RequestInit, "method">) => Promise<T>;
  post: <T>(url: string, body: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
  put: <T>(url: string, body: any, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
  delete: <T>(url: string, options?: Omit<RequestInit, "method" | "body">) => Promise<T>;
};
//#endregion
//#region src/network/get-real-url.d.ts
/** 从 url 响应头获取真实链接 */
declare const getRealURL: (originURL: string) => Promise<string>;
//#endregion
//#region src/network/image.d.ts
/**
 * 图片压缩选项
 */
type ImageCompressionOptions = {
  /** 压缩比率，默认 0.92 */quality?: number;
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
//#endregion
//#region src/network/to.d.ts
/**
 * Go 语言风格的异步处理方式
 * @param promise 一个能被 await 的异步函数
 * @returns 如果成功，返回 [null, 异步函数结果]，否则返回 [Error, undefined]
 *
 * @example
 * const [error, response] = await to(fetcher().get<Blog>("/blogs/hello-world"));
 */
declare const to: <T, E = Error>(promise: Promise<T>) => Promise<[null, T] | [E, undefined]>;
//#endregion
//#region src/number/random-int.d.ts
/**
 * 在指定闭区间内生成随机整数
 *
 * @example
 * randomInt(1, 10);    // 1 <= x <= 10
 */
declare const randomInt: (min: number, max: number) => number;
//#endregion
//#region src/object/map.d.ts
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
type DeepMapValues<T, R> = T extends Array<infer U> ? Array<DeepMapValues<U, R>> : T extends object ? { [K in keyof T]: T[K] extends object ? DeepMapValues<T[K], R> : R } : R;
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
  /** 过滤函数，返回 true 表示保留该字段 */filter?: (value: any, key: string | number) => boolean;
}) => DeepMapValues<T, R>;
//#endregion
//#region src/object/merge.d.ts
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
//#endregion
//#region src/object/omit.d.ts
/**
 * 从对象中排除指定的键，返回不包含这些键的新对象
 *
 * @typeParam T - 源对象的类型
 * @typeParam K - 要排除的键，必须是源对象的键之一
 *
 * @param obj - 源对象
 * @param keys - 要排除的键名数组
 * @returns 不包含指定键的新对象
 *
 * @example
 * const user = {
 *  id: 1,
 *  name: "Alice",
 *  age: 25,
 *  password: "secret"
 * };
 * // { id: 1, name: "Alice", age: 25 }
 * const safeUser = omit(user, ["password"]);
 */
declare const omit: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: readonly K[]) => Omit<T, K>;
/**
 * 从对象中排除满足条件的键值对，返回不包含这些键的新对象
 *
 * @typeParam T - 源对象的类型
 *
 * @param obj - 源对象
 * @param shouldOmit - 判断函数，接收键和值，返回 `true` 则排除该键值对
 * @returns 不包含满足条件的键值对的新对象
 *
 * @example
 * const user = {
 *  id: 1,
 *  name: "Alice",
 *  age: 25,
 *  password: "secret"
 * };
 * // { name: "Alice", password: "secret" }
 * const stringFields = omitBy(user, (key, value) => typeof value === "number");
 */
declare const omitBy: <T extends Record<string, any>>(obj: T, shouldOmit: (key: keyof T, value: T[keyof T]) => boolean) => Partial<T>;
//#endregion
//#region src/object/pick.d.ts
/**
 * 从对象中选取指定的键，返回仅包含这些键的新对象
 *
 * @typeParam T - 源对象的类型
 * @typeParam K - 要选取的键，必须是源对象的键之一
 *
 * @param obj - 源对象
 * @param keys - 要选取的键名数组
 * @returns 仅包含指定键的新对象
 *
 * @example
 * const user = {
 *  id: 1,
 *  name: "Alice",
 *  age: 25,
 *  password: "secret"
 * };
 * // { id: 1, name: "Alice", age: 25 }
 * const safeUser = pick(user, ["id", "name", "age"]);
 */
declare const pick: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: readonly K[]) => Pick<T, K>;
/**
 * 从对象中选取满足条件的键值对，返回仅包含这些键的新对象
 *
 * @typeParam T - 源对象的类型
 *
 * @param obj - 源对象
 * @param shouldPick - 判断函数，返回 `true` 时保留该字段
 * @returns 仅包含满足条件的键值对的新对象
 *
 * @example
 * const user = {
 *  id: 1,
 *  name: "Alice",
 *  age: 25,
 *  password: "secret"
 * };
 * // { id: 1, age: 25 }
 * const numericFields = pickBy(user, (key, value) => typeof value === "number");
 */
declare const pickBy: <T extends Record<string, any>>(obj: T, shouldPick: (key: keyof T, value: T[keyof T]) => boolean) => Partial<T>;
//#endregion
//#region src/string/case.d.ts
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
//#endregion
//#region src/string/compact.d.ts
/**
 * 将字符串压缩为单行精简格式
 *
 * @example
 * // "Hello\nworld"
 * compactStr(`Hello,
 *
 *  world
 *
 * !`);
 *
 * @example
 * // "Hello...world"
 * compactStr("Hello, beautiful world!", { maxLength: 15 });
 */
declare const compactStr: (text?: string, options?: {
  /**
   * 最大保留长度，超过该长度使用 "..." 替代
    @default Infinity
   */
  maxLength?: number;
  /**
   * 是否将换行符替换为字面量"\n"
   * @default false
   */
  disableNewLineReplace?: boolean;
  /**
   * 是否合并连续的换行符/制表符为单个
   * @default false
   */
  disableCollapse?: boolean;
}) => string;
//#endregion
//#region src/string/extract-error-message.d.ts
/** 从任意异常中提取类似 error.message 的可读文字 */
declare const extractErrorMessage: (error: unknown) => string;
//#endregion
//#region src/string/qs.d.ts
/**
 * 针对 URL 查询字符串的解析和序列化
 * @example
 * qs.parse("?a=1&b=2") // { a: 1, b: 2 }
 * qs.stringify({ a: 1, b: 2 }, { addQueryPrefix: true }) // "?a=1&b=2"
 */
declare const qs: {
  /** queryString -> queryParams */parse: (queryString: string) => Record<string, any>;
  stringify: (params: Record<string, any>, options?: {
    /**
     * 是否在结果前添加“?”
     * @default false
     */
    addQueryPrefix: boolean;
  }) => string;
};
//#endregion
//#region src/time/debounce.d.ts
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
//#endregion
//#region src/time/lock-queue.d.ts
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
declare class LockQueue {
  queue: Promise<any>;
  constructor();
  waitInQueue(): Promise<(value?: any) => void>;
}
//#endregion
//#region src/time/sleep.d.ts
/**
 * 延迟一段时间再执行后续代码
 * @param time 延迟时间，默认 150ms
 * @example
 * await sleep(1000); // 等待 1 秒执行后续代码
 */
declare const sleep: (time?: number) => Promise<unknown>;
//#endregion
//#region src/time/throttle.d.ts
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
//#endregion
export { CamelToSnake, Capitalize, type ChatCompletions, Decapitalize, DeepMapKeys, DeepMapValues, ImageCompressionOptions, LockQueue, LogOptions, Primitive, RequestInit, SetTtl, SnakeToCamel, camelToSnake, capitalize, chatCompletions, compactStr, debounce, decapitalize, extractErrorMessage, fetcher, getRealURL, imageUrlToBase64, isNil, isObject, isPrimitive, log, loopUntil, mapKeys, mapValues, mergeObjects, omit, omitBy, pick, pickBy, qs, randomInt, sleep, snakeToCamel, throttle, to, withCache };