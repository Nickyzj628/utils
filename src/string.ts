export type SnakeToCamel<S extends string> =
	S extends `${infer Before}_${infer After}`
		? After extends `${infer First}${infer Rest}`
			? `${Before}${Uppercase<First>}${SnakeToCamel<Rest>}`
			: Before
		: S;

/**
 * 下划线命名法转为驼峰命名法
 *
 * @example
 * snakeToCamel("user_name") // "userName"
 */
export const snakeToCamel = <S extends string>(str: S): SnakeToCamel<S> => {
	return str.replace(/_([a-zA-Z])/g, (match, pattern) =>
		pattern.toUpperCase(),
	) as SnakeToCamel<S>;
};

export type CamelToSnake<S extends string> =
	S extends `${infer First}${infer Rest}`
		? Rest extends Uncapitalize<Rest>
			? `${Lowercase<First>}${CamelToSnake<Rest>}`
			: `${Lowercase<First>}_${CamelToSnake<Rest>}`
		: Lowercase<S>;

/**
 * 驼峰命名法转为下划线命名法
 *
 * @example
 * camelToSnake("shouldComponentUpdate") // "should_component_update"
 */
export const camelToSnake = <S extends string>(str: S): CamelToSnake<S> => {
	return str.replace(
		/([A-Z])/g,
		(match, pattern) => `_${pattern.toLowerCase()}`,
	) as CamelToSnake<S>;
};

export type Capitalize<S extends string> = S extends `${infer P1}${infer Rest}`
	? P1 extends Capitalize<P1>
		? S
		: `${Uppercase<P1>}${Rest}`
	: S;

/**
 * 字符串首字母大写
 *
 * @example
 * capitalize("hello") // "Hello"
 */
export const capitalize = <S extends string>(s: S): Capitalize<S> => {
	return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<S>;
};

export type Decapitalize<S extends string> =
	S extends `${infer P1}${infer Rest}`
		? P1 extends Lowercase<P1>
			? P1
			: `${Lowercase<P1>}${Rest}`
		: S;

/**
 * 字符串首字母小写
 *
 * @example
 * decapitalize("Hello") // "hello"
 */
export const decapitalize = <S extends string>(s: S): Decapitalize<S> => {
	return (s.charAt(0).toLowerCase() + s.slice(1)) as Decapitalize<S>;
};

/**
 * 将 ArrayBuffer 转换为 base64 字符串
 * 兼容浏览器、Bun 和 Node.js
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]!);
	}
	return btoa(binary);
};

/**
 * 图片压缩选项
 */
export type ImageCompressionOptions = {
	/** 压缩比率，默认 0.92 */
	quality?: number;
	/**
	 * 自定义压缩函数，用于非浏览器环境（Node.js/Bun）
	 * 如果提供，将使用此函数替代默认的 canvas 压缩
	 * @param arrayBuffer 图片的 ArrayBuffer 数据
	 * @param mime 图片的 MIME 类型
	 * @param quality 压缩质量
	 * @returns 压缩后的 base64 字符串
	 */
	compressor?: (
		arrayBuffer: ArrayBuffer,
		mime: string,
		quality: number,
	) => Promise<string> | string;
};

/**
 * 图片地址转 base64 数据
 *
 * @param imageUrl 图片地址
 * @param options 可选配置
 * @param options.quality 压缩比率，默认 0.92
 * @param options.compressor 自定义压缩函数，用于 Node.js/Bun 环境
 *
 * @example
 * // 基本用法（浏览器自动使用 Canvas 压缩）
 * imageUrlToBase64("https://example.com/image.jpg");
 *
 * @example
 * // Node.js/Bun 使用 sharp 压缩
 * import sharp from "sharp";
 *
 * imageUrlToBase64("https://example.com/image.jpg", {
 *   quality: 0.8,
 *   compressor: async (buffer, mime, quality) => {
 *     const compressed = await sharp(Buffer.from(buffer))
 *       .jpeg({ quality: Math.round(quality * 100) })
 *       .toBuffer();
 *     return `data:${mime};base64,${compressed.toString("base64")}`;
 *   }
 * });
 */
export const imageUrlToBase64 = async (
	imageUrl: string,
	options: ImageCompressionOptions = {},
): Promise<string> => {
	const { quality = 0.92, compressor } = options;

	if (!imageUrl.startsWith("http")) {
		throw new Error("图片地址必须以http或https开头");
	}

	// 使用 fetch 获取图片数据
	const response = await fetch(imageUrl);
	if (!response.ok) {
		throw new Error(`获取图片失败: ${response.statusText}`);
	}

	const mime = response.headers.get("Content-Type") || "image/jpeg";
	const arrayBuffer = await response.arrayBuffer();

	// 对于非 JPEG/PNG 图片，直接返回 base64，不做压缩
	if (mime !== "image/jpeg" && mime !== "image/png") {
		const base64 = arrayBufferToBase64(arrayBuffer);
		return `data:${mime};base64,${base64}`;
	}

	// 如果提供了自定义压缩函数（用于 Node.js/Bun 环境），使用它
	if (compressor) {
		return await compressor(arrayBuffer, mime, quality);
	}

	// 浏览器环境：使用 OffscreenCanvas 压缩（Chrome 69+, Firefox 105+, Safari 16.4+）
	if (typeof OffscreenCanvas !== "undefined") {
		let bitmap: ImageBitmap | null = null;

		try {
			const blob = new Blob([arrayBuffer], { type: mime });
			bitmap = await createImageBitmap(blob);

			const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				throw new Error("无法获取 canvas context");
			}

			ctx.drawImage(bitmap, 0, 0);
			bitmap.close();
			bitmap = null;

			// OffscreenCanvas 使用 convertToBlob 获取压缩后的图片
			const compressedBlob = await canvas.convertToBlob({
				type: mime,
				quality: quality,
			});

			// 将 Blob 转换为 base64
			const compressedArrayBuffer = await compressedBlob.arrayBuffer();
			const base64 = arrayBufferToBase64(compressedArrayBuffer);
			return `data:${mime};base64,${base64}`;
		} catch {
			// Canvas 压缩失败，返回原始 base64
			bitmap?.close();
			const base64 = arrayBufferToBase64(arrayBuffer);
			return `data:${mime};base64,${base64}`;
		}
	}

	// 非浏览器环境且没有提供压缩器，直接返回原始 base64
	const base64 = arrayBufferToBase64(arrayBuffer);
	return `data:${mime};base64,${base64}`;
};

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
export const compactStr = (
	text: string = "",
	options?: {
		/** 最大保留长度，设为 0 或 Infinity 则不截断，默认 Infinity */
		maxLength?: number;
		/** 是否将换行符替换为字面量 \n，默认开启 */
		disableNewLineReplace?: boolean;
		/** 是否合并连续的空格/制表符为一个空格，默认开启 */
		disableWhitespaceCollapse?: boolean;
		/** 截断后的后缀，默认为 "..." */
		omission?: string;
	},
): string => {
	if (!text) return "";

	const {
		maxLength = Infinity,
		disableNewLineReplace = false,
		disableWhitespaceCollapse = false,
		omission = "...",
	} = options ?? {};

	let result = text;

	// 处理换行符
	if (!disableNewLineReplace) {
		result = result.replace(/\r?\n/g, "\\n");
	} else {
		result = result.replace(/\r?\n/g, " ");
	}

	// 合并连续空格
	if (!disableWhitespaceCollapse) {
		result = result.replace(/\s+/g, " ");
	}
	result = result.trim();

	// 截断多出来的文字
	if (maxLength > 0 && result.length > maxLength) {
		return result.slice(0, maxLength) + omission;
	}

	return result;
};
