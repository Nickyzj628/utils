# Agent 工作指南

## 项目概况

前端 TypeScript 工具库，零依赖，按功能模块组织在 `src/` 下。

## 开发命令

- **安装**: `pnpm install`（仓库使用 pnpm，但 CI 文档部署使用 `npm install`）
- **构建**: `pnpm run build` → 使用 `tsdown` 生成 `dist/`（ESM + `.d.mts`）
- **代码检查与格式化**: `pnpm run check` → `biome check --diagnostic-level=error --write src/`
- **文档生成**: `pnpm run docs` → TypeDoc 输出到 `docs/`

## 代码规范

- **格式**: Biome 管理，使用 **Tab 缩进**、**双引号**
- **TypeScript**: `strict: true`，`verbatimModuleSyntax: true`，`allowImportingTsExtensions: true`
- **允许 `any`**: `noExplicitAny` 已关闭
- **模块**: 纯 ESM（`"type": "module"`），`module: "Preserve"`

## 目录结构

```
src/
  ai/          # AI 相关（chatCompletions、defineModel）
  dom/         # DOM 工具
  function/    # 函数工具
  hoc/         # 高阶函数
  is/          # 类型判断
  network/     # 网络请求（fetcher 等）
  number/      # 数字工具
  object/      # 对象操作
  string/      # 字符串处理
  time/        # 时间/节流防抖等
  test/        # ⚠️ 手动测试脚本，不是自动化测试套件
  index.ts     # 总入口，重新导出所有模块
```

## 添加新工具

1. 在对应分类目录下创建文件
2. 在对应分类的 `index.ts` 中导出
3. 在 `src/index.ts` 中重新导出该分类

## 注意事项

- 无测试框架配置，`src/test/` 是含真实 API Key 的手动脚本，**不要误将其当单元测试运行**
- **禁止读取 `.gitignore` 中忽略的任何文件或目录**（含 `src/test/`、`.npmrc`、`.env` 等）
- `tsdown.config.ts` 入口仅 `src/index.ts`，`minify: true`
- `typedoc.json` 显式列出 10 个模块入口，新增模块需同步更新
- CI（`.github/workflows/docs.yml`）在 `push` 到 `main` 时自动构建并提交文档到 `docs/` 分支
- `dist/` 和 `docs/` 已加入版本控制（由构建流程生成）
