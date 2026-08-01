/**
 * 创建XML标签包裹的文本
 * @param tagName 标签名
 * @param content 标签内容，支持嵌套createXMLText()
 * @param props 标签属性
 * @returns `<tagName>\ncontent\n</tagName>`
 * @example
 * createXMLText("summary", "摘要内容", { updated: "xxx" }) // "<summary updated="xxx">\n摘要内容\n</summary>"
 */
export const createXMLText = (
	tagName: string,
	content: any,
	props: Record<string, any> = {},
): string => {
	const propStrs = Object.entries(props).map(
		([key, value]) => `${key}="${value}"`,
	);

	return `<${tagName}${propStrs.length > 0 ? ` ${propStrs.join(" ")}` : ""}>\n${content}\n</${tagName}>`;
};

/**
 * 提取文本中检测到的XML标签列表
 * @param text 待检测文本
 * @param tags 可选：只提取属于该列表中的标签（不区分大小写）；不传或传空数组时提取全部标签
 * @returns 检测到的标签名数组（统一小写、按首次出现顺序去重），未检测到任何标签时返回空数组
 * @example
 * extractXmlTags("纯文本") // []
 * extractXmlTags("<summary>摘要</summary>", ["summary"]) // ["summary"]
 * extractXmlTags("<system-reminder>提醒</system-reminder>", ["summary", "system-reminder"]) // ["system-reminder"]
 * extractXmlTags("<system-reminder>提醒</system-reminder>", ["summary"]) // []
 * extractXmlTags("<summary>摘要</summary><foo>x</foo>") // ["summary", "foo"]
 */
export const extractXmlTags = (text: string, tags: string[] = []): string[] => {
	// 目标标签转小写，用于不区分大小写的匹配
	const targets = new Set(tags.map((tag) => tag.toLowerCase()));
	// 用 Set 去重并保持首次出现顺序
	const found = new Set<string>();
	// 标签提取正则为唯一实现，src/ai/compact/utils.ts 直接复用本函数，无需内联正则
	const tagPattern = /<\/?([a-zA-Z][\w-]*)/g;
	for (const match of text.matchAll(tagPattern)) {
		const tagName = (match[1] ?? "").toLowerCase();
		// tags为空 => 提取任意XML标签；否则只提取目标列表中的标签
		if (targets.size === 0 || targets.has(tagName)) {
			found.add(tagName);
		}
	}
	return [...found];
};
