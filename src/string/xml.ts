/**
 * 创建XML标签包裹的文本
 * @param tagName 标签名
 * @param content 标签内容
 * @returns `<tagName>\ncontent\n</tagName>`
 * @example
 * createXMLTag("summary", "摘要内容") // "<summary>\n摘要内容\n</summary>"
 */
export const createXMLTag = (tagName: string, content: string): string =>
	`<${tagName}>\n${content}\n</${tagName}>`;

/**
 * 检测文本中是否含有XML标签
 * @param text 待检测文本
 * @param allowedTags 允许的标签名白名单（不区分大小写），不传时任何XML标签都会返回true
 * @returns 含有不在白名单中的XML标签时返回true
 * @example
 * hasXmlTags("纯文本") // false
 * hasXmlTags("<summary>摘要</summary>", ["summary"]) // false
 * hasXmlTags("<system-reminder>提醒</system-reminder>", ["summary"]) // true
 */
export const hasXmlTags = (
	text: string,
	allowedTags: string[] = [],
): boolean => {
	const allowed = new Set(allowedTags.map((tag) => tag.toLowerCase()));
	const tagPattern = /<\/?([a-zA-Z][\w-]*)/g;
	for (const match of text.matchAll(tagPattern)) {
		if (!allowed.has((match[1] ?? "").toLowerCase())) {
			return true;
		}
	}
	return false;
};
