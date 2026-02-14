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
 * 尝试动态导入 sharp 模块
 * 用于检测用户项目中是否安装了 sharp
 */
const tryImportSharp = async () => {
	try {
		// 动态导入 sharp，避免在浏览器环境中报错
		// 使用 new Function 避免 TypeScript 编译时解析该模块（sharp 是可选依赖）
		const dynamicImport = new Function(
			"modulePath",
			"return import(modulePath)",
		);
		const sharpModule = await dynamicImport("sharp");
		return sharpModule.default || sharpModule;
	} catch {
		return null;
	}
};

/**
 * 使用 sharp 压缩图片
 */
const compressWithSharp = async (
	sharp: any,
	arrayBuffer: ArrayBuffer,
	mime: string,
	quality: number,
): Promise<string> => {
	const buffer = Buffer.from(arrayBuffer);
	let sharpInstance = sharp(buffer);

	// 根据 MIME 类型设置压缩选项
	if (mime === "image/jpeg") {
		sharpInstance = sharpInstance.jpeg({ quality: Math.round(quality * 100) });
	} else if (mime === "image/png") {
		// PNG 使用 compressionLevel (0-9)，将 quality (0-1) 映射到 compressionLevel
		const compressionLevel = Math.round((1 - quality) * 9);
		sharpInstance = sharpInstance.png({ compressionLevel });
	}

	const compressedBuffer = await sharpInstance.toBuffer();
	return `data:${mime};base64,${compressedBuffer.toString("base64")}`;
};

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
	compressor?: (
		arrayBuffer: ArrayBuffer,
		mime: string,
		quality: number,
	) => Promise<string> | string;
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
export const imageUrlToBase64 = async (
	imageUrl: string,
	options: ImageCompressionOptions = {},
): Promise<string> => {
	const { quality = 0.92, compressor, fetcher = fetch } = options;

	if (!imageUrl.startsWith("http")) {
		throw new Error("图片地址必须以http或https开头");
	}

	// 使用自定义 fetch 获取图片数据
	const response = await fetcher(imageUrl);
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

	// 如果提供了自定义压缩函数，优先使用它
	if (compressor) {
		return await compressor(arrayBuffer, mime, quality);
	}

	// 浏览器环境：使用 OffscreenCanvas 压缩
	if (typeof OffscreenCanvas !== "undefined") {
		let bitmap: ImageBitmap | null = null;

		try {
			const blob = new Blob([arrayBuffer], { type: mime });
			bitmap = await createImageBitmap(blob);

			const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				throw new Error("无法获取 OffscreenCanvas context");
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
			// OffscreenCanvas 压缩失败，返回原始 base64
			bitmap?.close();
			const base64 = arrayBufferToBase64(arrayBuffer);
			return `data:${mime};base64,${base64}`;
		}
	}

	// Node.js/Bun 环境：尝试使用 sharp 进行压缩
	const sharp = await tryImportSharp();
	if (sharp) {
		try {
			return await compressWithSharp(sharp, arrayBuffer, mime, quality);
		} catch {
			// sharp 压缩失败，返回原始 base64
			const base64 = arrayBufferToBase64(arrayBuffer);
			return `data:${mime};base64,${base64}`;
		}
	}

	// 没有可用的压缩方式，直接返回原始 base64
	const base64 = arrayBufferToBase64(arrayBuffer);
	return `data:${mime};base64,${base64}`;
};
