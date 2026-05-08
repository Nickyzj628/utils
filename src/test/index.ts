import { ProxyAgent, setGlobalDispatcher } from "undici";
import { chatCompletions, defineModel } from "../ai";

// 显式启用代理
const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");
setGlobalDispatcher(proxyAgent);

const model = defineModel({
	baseURL: "https://openrouter.ai/api/v1",
	apiKey: "",
	model: "google/gemma-4-26b-a4b-it",
});

const result = await chatCompletions(
	model,
	// [{ role: "user", content: "你是什么模型？能帮我查询上海天气吗？" }],
	[
		{
			role: "user",
			content: [
				{
					// type: "image_url",
					// image_url: {
					// 	url: "https://nickyzj.run:2020/Nickyzj/Photos/Blogs/%E5%B9%B4%E5%BA%A6%E6%80%BB%E7%BB%933/4.jpeg",
					// },
					type: "video_url",
					video_url: {
						url: "https://nickyzj.run:2020/Nickyzj/Animes/202510/%E5%85%83%E7%A5%96%EF%BC%81BanG%20Dream%20Chan/%5Bhyakuhuyu%5D%5BGANSO%20BanG%20Dream%20Chan%5D%5B22%5D%5B1080p%20AVC%20AAC%5D%5BCHS%5D.mp4",
					},
				},
				{
					type: "text",
					// text: "你能看见我发送的图片吗？",
					text: "你能看见我发送的视频吗？",
				},
			],
		},
	],
	{
		// stream: true,
		// tools: [
		// 	{
		// 		type: "function",
		// 		function: {
		// 			name: "getWeather",
		// 			description: "查询城市天气情况",
		// 			parameters: {
		// 				type: "object",
		// 				properties: { city: { type: "string" } },
		// 			},
		// 		},
		// 	},
		// ],
		// toolHandlers: {
		// 	getWeather: (args) => `${args.city}今日晴转多云，25°C`,
		// },
	},
);

// for await (const { reasoningContent, content, usage } of result) {
// 	console.log(reasoningContent || content || usage);
// }

console.log(result);
