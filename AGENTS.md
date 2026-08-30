# AGENTS.md — @nickyzj2023/utils

0 依赖的 TypeScript 前端工具库（ESM），按领域分模块导出各类工具函数。

## Project

- 包名 `@nickyzj2023/utils`，发布产物为 `dist/`（tsdown 构建，ESM + .d.mts，minify）。
- 入口 `src/index.ts`，从 10 个领域模块汇总 re-export。
- 源码仅 `src/`；`dist/`、`docs/` 均为构建产物且被 git 跟踪（docs 由 CI 自动更新并提交）。
- 文档站 https://nickyzj628.github.io/utils/ （TypeDoc + typedoc-material-theme）。

## Commands

```bash
pnpm run check       # biome lint + 自动格式化（--write，会改 src/ 文件），提交前必跑
pnpm run build       # tsdown 构建到 dist/
pnpm run docs        # typedoc 生成 docs/
pnpm run prepublish  # check && build && docs（发布前完整流程）
```

- 无测试框架。本地调试用手写脚本 `src/test.ts`（被 .gitignore 的 `test.*` 忽略，不会提交）。
- CI（.github/workflows/docs.yml）用 `npm install` + `npm run docs`。

## Architecture

各模块目录均含 `index.ts` 汇总 re-export 内部文件：

| 模块 | 职责 |
|---|---|
| `src/ai/` | LLM 相关：`chatCompletions` 客户端、`compactMessages` 上下文压缩（软删除/总结/工具组对齐）、`estimateTokens` |
| `src/dom/` | `logger` 浏览器控制台日志 |
| `src/function/` | `loopUntil` 条件轮询 |
| `src/hoc/` | `withCache` 高阶函数缓存包装 |
| `src/is/` | `isNil` / `isObject` / `isPrimitive` 类型判断 |
| `src/network/` | `fetcher`、`to`（Go 风格 [err, data]）、`parseSSE`、`getRealURL`、`imageUrlToBase64` |
| `src/number/` | `randomInt` |
| `src/object/` | `pick` / `omit` / `mapKeys` / `mapValues` / `mergeObjects` 等 |
| `src/string/` | `compactStr`、`qs`、`xml`（createXMLText/hasXmlTag/extractXmlTagContent）、大小写转换、`extractErrorMessage` |
| `src/time/` | `debounce` / `throttle` / `sleep` / `lockQueue`（已弃用，建议改用 Web Locks API） |

新增模块需同步：`src/index.ts` 加导出、`typedoc.json` entryPoints 加模块入口。

## Conventions

- **0 依赖**：不引入任何运行时依赖；devDependencies 仅构建/检查工具。
- **命名导出**：一律 `export const` / `export function` / `export type`，无默认导出。
- **中文 JSDoc**：每个公开函数带中文注释和 `@example`；内部复杂逻辑加中文注释解释"为什么"。
- **格式化**：交给 biome（tab 缩进、双引号、分号、尾逗号、CRLF 行尾），改完代码跑 `pnpm run check`。
- **TS 严格模式**：`strict` + `noUncheckedIndexedAccess`（数组/对象索引访问可能为 undefined，需判空）。
- **提交信息**：中文 conventional commits，如 `feat(string.xml): 新增 createXMLTag`。

## Notes

（后续补充）
