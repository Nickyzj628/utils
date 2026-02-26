男生自用全新前端工具库

安装到你的前端项目里：

```bash
# npm
npm install @nickyzj2023/utils

# yarn
yarn add @nickyzj2023/utils

# pnpm
pnpm add @nickyzj2023/utils

```

使用方式：

```typescript
import { fetcher, to } from "@nickyzj2023/utils";

const api = fetcher("https://api.example.com");

const [error, data] = await to(api.get<Blog>("/blogs/hello-world"));
if (error) {
  console.error(error);
  return;
}

console.log(data);
```


