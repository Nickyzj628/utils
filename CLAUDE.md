# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`@nickyzj2023/utils` 是一个 **0 运行时依赖**的前端 TypeScript 工具库,仅以 ESM 形式发布。所有 `devDependencies` 必须保持为 0 — 添加任何运行时依赖前需先确认。

## 常用命令

```bash
pnpm install                # 推荐用 pnpm,仓库带 pnpm-workspace.yaml 和 lockfile
pnpm build                  # tsdown 打包,产物在 dist/ (ESM + .d.mts,已 minify)
pnpm check                  # biome 检查并自动修复 src/ (--write,会改文件)
pnpm docs                   # 生成 TypeDoc 文档到 docs/
```

无测试框架。

## 架构

### 模块组织(扁平 + 分类)

`src/` 下 10 个分类目录,每个目录是一个独立模块单位:
`ai / dom / function / hoc / is / network / number / object / string / time`

三层导出结构:

1. **叶子文件** (如 `time/debounce.ts`) — 实现并 `export const xxx`
2. **分类 index.ts** (如 `time/index.ts`) — 只做 `export * from "./xxx"` 聚合
3. **根 index.ts** (`src/index.ts`) — `export * from "./time"` 等 10 行,让用户用 `import { debounce } from "@nickyzj2023/utils"` 平铺导入

特殊情况:复杂工具会再下一层(如 `ai/chatCompletions/{index,types,utils}.ts`),此时分类 index 转发到子目录 index。

### 跨模块引用必须走目录,不走文件

模块间互相引用时,**永远 import 自分类目录**,不要直达文件:

```ts
// ✓ 正确
import { isNil, isObject } from "../is";
import { mergeObjects } from "../object";

// ✗ 错误
import { isNil } from "../is/is-nil";
```

这保证了内部重构(拆分/合并文件)不会污染调用方。

### 命名约定

- 文件名:**kebab-case**(`loop-until.ts`、`extract-error-message.ts`)
- 导出符号:**camelCase**(`loopUntil`、`extractErrorMessage`)
- 类型守卫(runtime type check)统一放 `is/`,函数名以 `is` 开头

### 构建链

- **打包**: [tsdown.config.ts](tsdown.config.ts) — 单入口 `src/index.ts` → ESM + .d.mts,minify
- **TS 配置**: 严格模式,启用 `noUncheckedIndexedAccess` 和 `verbatimModuleSyntax`,关闭 `noExplicitAny`(允许 `any`)和 `noUnusedFunctionParameters`
- **Biome**: tab 缩进、双引号、自动整理 import;允许 `any` 与未使用参数,`noNonNullAssertion` 仅 info 级
- **TypeDoc**: [typedoc.json](typedoc.json) 显式列出 10 个分类目录的 `index.ts` 作为 entryPoints,每个目录在文档左侧成为一个独立模块。**不要**改成 `entryPointStrategy: "expand"`,会把每个文件展开成子模块,污染导航

### 文档发布

[.github/workflows/docs.yml](.github/workflows/docs.yml) 在 push 到 main 时自动 `npm run docs` 并把 `docs/` 目录提交回仓库,GitHub Pages 服务于该目录。**不要手动改 `docs/` 下的内容** — 它会被覆盖。

发包到 npm 没有自动化 — 手动 `pnpm build && npm publish`。

## 添加新工具的流程

**加在已有分类下**:

1. 在 `src/<分类>/` 下新建 kebab-case 文件
2. 实现并加 JSDoc(中文,带 `@param`、`@remarks`、`@example`,参考 [src/time/debounce.ts](src/time/debounce.ts))
3. 在该分类的 `index.ts` 加 `export * from "./新文件"`

**新增分类目录**:

1. `mkdir src/<新分类>` 并建 `index.ts`
2. 在 [src/index.ts](src/index.ts) 加 `export * from "./<新分类>"`
3. 在 [typedoc.json](typedoc.json) 的 `entryPoints` 数组加 `"src/<新分类>/index.ts"`(漏掉这步会导致文档没有该模块)

## JSDoc 规范

库通过 TypeDoc 渲染成中文站点。每个公开导出至少要有:

- 一句话描述(顶部)
- `@param` 参数说明
- `@example` 代码示例
- 可选 `@remarks` 解释适用场景或与相近工具的区别

签名里出现的类型若来自子文件(如 `chatCompletions/types.ts`),分类的 index.ts 必须 `export type` 把它们再导出一遍,否则 TypeDoc 会报 "referenced but not included" 警告。
