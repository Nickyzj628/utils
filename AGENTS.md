# AGENTS.md

This file contains essential information for AI coding agents working on this project.

## Project Overview

这是一个前端工具库（Frontend Utility Library），提供常用的 TypeScript/JavaScript 工具函数，帮助开发者简化日常开发任务。项目使用 Bun 作为运行时和构建工具，发布到 npm 仓库 `@nickyzj2023/utils`。

## Technology Stack

- **Runtime**: [Bun](https://bun.com) v1.3.2+ - 快速的 JavaScript 运行时和包管理器
- **Language**: TypeScript 5.9.3+
- **Build Tool**: Bun 内置打包器
- **Linting/Formatting**: Biome 2.3.14
- **Documentation**: TypeDoc 0.28.16 + Material Theme
- **Dependencies**:
  - `sharp` (^0.34.5) - 图片处理库，用于 `imageUrlToBase64` 功能

## Project Structure

```
.
├── src/                    # 源代码目录
│   ├── index.ts           # 入口文件，导出所有模块
│   ├── dom.ts             # DOM 相关工具（timeLog）
│   ├── function.ts        # 函数控制工具（loopUntil）
│   ├── hoc.ts             # 高阶函数（withCache）
│   ├── is.ts              # 类型判断工具（isObject, isPrimitive, isFalsy, isTruthy, isNil）
│   ├── lru-cache.ts       # LRU 缓存实现
│   ├── network.ts         # 网络请求工具（fetcher, to, getRealURL）
│   ├── number.ts          # 数字工具（randomInt）
│   ├── object.ts          # 对象操作工具（mergeObjects, mapKeys, mapValues）
│   ├── string.ts          # 字符串工具（snakeToCamel, camelToSnake, capitalize, decapitalize, imageUrlToBase64, compactStr）
│   └── time.ts            # 时间控制工具（sleep, debounce, throttle）
├── dist/                  # 构建输出目录（包含 .js 和 .d.ts 文件）
├── docs/                  # TypeDoc 生成的文档网站
├── package.json           # 包配置
├── tsconfig.json          # TypeScript 配置
├── biome.json             # Biome 代码规范配置
└── .gitignore             # Git 忽略规则
```

## Build Commands

```bash
# 完整构建（打包 + 类型声明 + 文档）
bun run build

# 仅生成文档
bun run docs
```

构建流程：
1. `bun build --target=bun --outdir ./dist --minify ./src/index.ts` - 使用 Bun 打包并压缩
2. `tsc` - 生成 TypeScript 类型声明文件（.d.ts）
3. `typedoc src/index.ts --plugin typedoc-material-theme` - 生成 API 文档

## Code Style Guidelines

项目使用 **Biome** 进行代码格式化和静态检查，配置见 `biome.json`：

- **缩进**: Tab（非空格）
- **引号**: 双引号（double）
- **规则**:
  - 启用推荐规则
  - 允许未使用的变量和函数参数（`noUnusedVariables: off`, `noUnusedFunctionParameters: off`）
  - 允许显式使用 `any` 类型（`noExplicitAny: off`）
  - 允许非空断言（`noNonNullAssertion: off`）
  - 不强制使用模板字符串（`useTemplate: off`）

### 代码规范

1. **注释语言**: 使用中文编写 JSDoc 注释
2. **导出方式**: 所有工具函数使用命名导出（named exports）
3. **类型定义**: 
   - 工具类型（如 `Primitive`, `Falsy`, `SnakeToCamel`）与实现放在同一文件
   - 复杂类型使用 TypeScript 模板字面量类型进行转换
4. **函数风格**: 
   - 优先使用箭头函数
   - 泛型函数使用 `<T>` 语法
   - 类型守卫函数返回 `value is Type`

## Module Organization

项目按功能领域划分模块：

| 模块 | 功能描述 | 主要导出 |
|------|---------|---------|
| `is` | 类型判断 | `isObject`, `isPrimitive`, `isFalsy`, `isTruthy`, `isNil`, `Primitive`, `Falsy` |
| `network` | 网络请求 | `fetcher`, `to`, `getRealURL`, `RequestInit` |
| `object` | 对象操作 | `mergeObjects`, `mapKeys`, `mapValues`, `DeepMapKeys`, `DeepMapValues` |
| `string` | 字符串处理 | `snakeToCamel`, `camelToSnake`, `capitalize`, `decapitalize`, `imageUrlToBase64`, `compactStr` |
| `time` | 时间控制 | `sleep`, `debounce`, `throttle` |
| `function` | 函数控制 | `loopUntil` |
| `hoc` | 高阶函数 | `withCache`, `SetTtl` |
| `lru-cache` | 缓存实现 | `LRUCache`（默认导出） |
| `dom` | DOM 工具 | `timeLog` |

## Testing

**当前项目没有测试框架配置**。如需添加测试，建议使用：
- Bun 内置测试运行器（`bun:test`）

## Publishing

项目发布到 npm 仓库：
- 包名: `@nickyzj2023/utils`
- 版本: 见 `package.json` 中的 `version` 字段
- 入口: `dist/index.js`（ES Module）
- 类型: `dist/index.d.ts`

## Security Considerations

1. **敏感信息**: `.npmrc` 文件包含 npm 认证令牌，已在 `.gitignore` 中配置忽略
2. **依赖安全**: `sharp` 是原生依赖，需要确保其安全性
3. **网络请求**: `fetcher` 函数会解析 JSON 错误响应，注意潜在的安全风险

## Development Workflow

1. 修改源代码（`src/` 目录）
2. 运行 `bun run build` 构建项目
3. 检查生成的类型声明文件（`dist/*.d.ts`）
4. 查看文档（`docs/` 目录或启动本地服务器查看）
5. 提交更改

## Important Notes

- 项目使用 ES Module（`"type": "module"`），不支持 CommonJS
- 构建目标为 Bun 运行时（`--target=bun`）
- `imageUrlToBase64` 功能依赖 `sharp` 库，需要 Node.js/Bun 原生环境支持
- `fetcher` 函数基于 Fetch API，在 Bun 环境下使用 `BunFetchRequestInit` 类型
