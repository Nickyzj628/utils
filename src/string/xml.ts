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
 * 转义正则表达式的元字符，使标签名可安全拼入正则
 * @param value 原始字符串
 * @returns 转义后的字符串
 */
const escapeRegExp = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 判断文本中是否包含指定XML标签（不区分大小写，开/闭标签均可命中）
 * @param text 待检测文本
 * @param tag 目标标签名
 * @returns 检测到目标标签时返回 true，否则返回 false
 * @remarks 标签名不要求合法XML格式，但需避免标签名与后缀字符粘连（如 `<summary-x>` 不会命中 `summary`）
 * @example
 * hasXmlTag("纯文本", "summary") // false
 * hasXmlTag("<summary>摘要</summary>", "summary") // true
 * hasXmlTag("<SUMMARY x=\"1\">摘要</SUMMARY>", "summary") // true
 */
export const hasXmlTag = (text: string, tag: string): boolean => {
	// 用 (?=[\s/>]) 限定标签名后必须紧跟空白、斜杠或右尖括号，避免误匹配 <summaryx>
	const pattern = new RegExp(`<\\/?${escapeRegExp(tag)}(?=[\\s/>])`, "i");
	return pattern.test(text);
};

/**
 * 提取文本中第一个匹配标签的文本内容（不区分大小写）
 * @param text 待检测文本
 * @param tag 目标标签名
 * @returns 成对标签的内容字符串；未检测到匹配的标签时返回 null
 * @remarks 采用非贪婪匹配，标签嵌套时返回最内层内容；标签内容为空时返回空字符串
 * @example
 * extractXmlTagContent("<summary>摘要</summary>", "summary") // "摘要"
 * extractXmlTagContent("<SUMMARY>摘要</SUMMARY>", "summary") // "摘要"
 * extractXmlTagContent("<summary>摘要</summary>", "foo") // null
 */
export const extractXmlTagContent = (
	text: string,
	tag: string,
): string | null => {
	const pattern = new RegExp(
		`<${escapeRegExp(tag)}(?:[^>]*)>([\\s\\S]*?)</${escapeRegExp(tag)}>`,
		"i",
	);
	// 有匹配则返回内容（内容可能为空字符串），无匹配返回 null
	const match = pattern.exec(text);
	return match ? (match[1] ?? "") : null;
};
