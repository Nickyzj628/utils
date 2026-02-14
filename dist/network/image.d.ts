/**
 * 图片压缩选项
 */
export type ImageCompressionOptions = {
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
 * // 基本用法（浏览器自动使用 Canvas 压缩，Node.js/Bun 自动检测并使用 sharp）
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
export declare const imageUrlToBase64: (imageUrl: string, options?: ImageCompressionOptions) => Promise<string>;
