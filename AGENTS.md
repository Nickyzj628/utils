# AGENTS.md

This file contains essential information for AI coding agents working on this project.

## Project Overview

这是一个前端工具库（Frontend Utility Library），提供常用的 TypeScript/JavaScript 工具函数，帮助开发者简化日常开发任务。项目使用 pnpm 作为包管理器，发布到 npm 仓库 `@nickyzj2023/utils`。

## Technology Stack

- **Package Manager**: [pnpm](https://pnpm.io)
- **Language**: TypeScript 5.9.3+
- **Build Tool**: tsdown (ESM bundler with type declarations)
- **Linting/Formatting**: Biome 2.4.4
- **Documentation**: TypeDoc 0.28.17 + Material Theme
- **Dependencies**: 零运行时依赖，仅开发依赖

## Build Commands

```bash
# 完整构建（打包 + 类型声明）
pnpm build

# 仅生成文档
pnpm docs

# 代码检查（格式 + 静态分析）
pnpm biome check .

# 自动修复格式问题
pnpm biome format --write .

# 类型检查
pnpm tsc --noEmit
```

注意：项目没有配置测试框架，无法运行单元测试。

## Project Structure

```
src/
├── index.ts           # 入口文件，导出所有模块
├── dom/               # DOM 相关工具
├── function/          # 函数控制工具
├── hoc/               # 高阶函数
├── is/                # 类型判断工具
├── network/           # 网络请求工具
├── number/            # 数字工具
├── object/            # 对象操作工具
├── string/            # 字符串处理工具
├── time/              # 时间控制工具
└── lru-cache.ts       # LRU 缓存实现
dist/                  # 构建输出目录
docs/                  # TypeDoc 生成的文档
```

## Code Style Guidelines

项目使用 **Biome** 进行代码格式化和静态检查，配置见 `biome.json`。

### 格式化规则

- **缩进**: Tab（不是空格）
- **引号**: 双引号（double quotes）
- **每行末尾**: 不保留多余空格
- **语句末尾**: 使用分号

### Biome 配置要点

```json
{
  "formatter": { "indentStyle": "tab" },
  "linter": {
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "off",
        "noUnusedFunctionParameters": "off"
      },
      "suspicious": { "noExplicitAny": "off" },
      "style": {
        "noNonNullAssertion": "off",
        "useTemplate": "off"
      }
    }
  }
}
```

## 代码规范

### 命名规范

- **文件名**: 使用 kebab-case（如 `is-primitive.ts`、`debounce.ts`）
- **函数名**: 使用 camelCase（如 `debounce`、`mergeObjects`）
- **类型名**: 使用 PascalCase（如 `Primitive`、`RequestInit`）
- **常量**: 使用 PascalCase（如 `SetTtl`）

### 导入规范

- 使用相对路径导入同模块文件（如 `import { isNil } from "../is"`）
- 使用路径别名时保持一致性
- 导入顺序：外部库 -> 内部模块 -> 类型导入

### 导出规范

- 所有工具函数使用命名导出（named exports）
- 入口文件使用 `export * from "./module"` 集中导出
- 类型与实现放同一文件，按需导出

### 类型定义

- 工具类型（如 `Primitive`、`Falsy`）与实现放在同一文件
- 复杂类型使用 TypeScript 模板字面量类型
- 类型守卫函数返回 `value is Type` 形式

### 函数风格

- 优先使用箭头函数
- 泛型函数使用 `<T>` 语法
- 函数参数支持默认值的放在后面

### JSDoc 注释

- 使用 **中文** 编写注释
- 每个导出函数/类型添加 JSDoc 注释
- 包含 `@example` 代码示例
- 复杂逻辑添加 `@remarks` 说明

### 错误处理

- 网络请求使用 Go 语言风格：`const [error, data] = await to(promise)`
- 抛出 Error 时包含有意义的错误信息
- 不捕获可能的异常，让调用方处理

## Module Organization

每个模块目录结构：
- `index.ts` - 集中导出该模块的所有功能
- 具体实现文件（如 `debounce.ts`、`sleep.ts`）

| 模块 | 主要导出 |
|------|---------|
| `is` | `isObject`, `isPrimitive`, `isFalsy`, `isTruthy`, `isNil` |
| `network` | `fetcher`, `to`, `getRealURL`, `imageUrlToBase64` |
| `object` | `mergeObjects`, `mapKeys`, `mapValues` |
| `string` | `snakeToCamel`, `camelToSnake`, `capitalize`, `compactStr` |
| `time` | `sleep`, `debounce`, `throttle` |
| `function` | `loopUntil` |
| `hoc` | `withCache` |
| `dom` | `timeLog` |
| `number` | `randomInt` |

## Development Workflow

1. 修改源代码（`src/` 目录）
2. 运行 `pnpm biome check .` 检查代码
3. 运行 `pnpm build` 构建项目
4. 检查生成的类型声明文件（`dist/*.d.ts`）
5. 提交更改

## Publishing

- 包名: `@nickyzj2023/utils`
- 入口: `dist/index.mjs`（ES Module）
- 类型: `dist/index.d.mts`

## Security Considerations

1. **敏感信息**: `.npmrc` 包含 npm 令牌，已在 `.gitignore` 中忽略
2. **网络请求**: `fetcher` 函数会解析 JSON 错误响应
3. **动态导入**: `imageUrlToBase64` 使用动态导入尝试加载 `sharp`

## Important Notes

- 项目使用 ES Module（`"type": "module"`），不支持 CommonJS
- `imageUrlToBase64` 在浏览器使用 OffscreenCanvas，在 Node.js 尝试 sharp
- `fetcher` 基于 Fetch API，支持 `proxy` 选项
- 所有工具函数尽量设计为纯函数，无副作用
