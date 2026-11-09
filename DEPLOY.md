# 部署与发布

这个应用是纯静态 SPA，数据全部在浏览器 IndexedDB 里，没有后端。部署走 **Cloudflare Pages 的 Git 集成**：把仓库推到 GitHub，在 Cloudflare 里连一次，之后每次 push 自动构建。

不需要 `wrangler`、API Token 或本机登录。

## 构建配置

在 Cloudflare Pages 的 **Build configuration** 里填：

| 配置项 | 值 |
| --- | --- |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `app/dist` |
| Root directory | 留空（仓库根目录） |
| Node version | `22`（环境变量 `NODE_VERSION=22`） |

仓库根目录已有 `.nvmrc` 和 `package.json` 的 `engines`，但 Cloudflare 仍建议显式设置 `NODE_VERSION=22`。

`app/dist` 是构建产物目录，已在 `.gitignore` 里忽略；Cloudflare 会在构建时生成，不需要提交。

## 首次部署

1. 把仓库推到 GitHub。
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git。
3. 选择仓库和分支（`main`）。
4. 按上面的构建配置填写，保存并部署。
5. 首次构建完成后得到 `https://<项目名>.pages.dev`。
6. 试用期直接用 `*.pages.dev`，不需要买域名。自定义域名可随时在 Pages 的 Custom domains 里补绑；PWA 与通知需要 HTTPS，Pages 默认提供。

之后每次 push 到 `main` 都会自动构建和部署；PR 也可以生成预览部署。

## 本地构建

```bash
npm ci
npm run build
npm run preview
```

- `app/dist/` 是可直接托管的静态目录。
- 应用使用 hash 路由（`/#/today`），不需要服务器把未知路径重写到 `index.html`。
- Service Worker 只在生产构建注册；`npm run dev` 下不注册，方便 HMR。

## CI

`.github/workflows/ci.yml` 在 push / PR 时执行：

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

构建后的 `app/dist/` 会作为 workflow artifact 保留 7 天。CI 不负责部署，部署由 Cloudflare Pages 的 Git 集成完成。

## 缓存与头

`public/_headers` 会随构建复制到 `app/dist/_headers`：

- `/*`：只放安全头，不设 `Cache-Control`，避免和更具体的规则叠加。
- `/`、`/index.html`：`no-cache`，确保入口更新及时生效。
- `/assets/*`：一年 immutable；Vite 文件名带内容哈希，可以放心长缓存。
- `/sw.js`：`no-cache` + `Service-Worker-Allowed: /`。
- `/manifest.webmanifest`：`no-cache` + 正确 MIME。

Cloudflare 的 `_headers` 命中多条规则时会继承全部头，同名头用逗号拼接；所以这里没有用 `/*` 的 `Cache-Control` 去覆盖 `/assets/*`。

Service Worker 的缓存键是 `sixty-shell-v3`。如果以后大改静态资源或缓存策略，记得递增 `public/sw.js` 里的 `CACHE` 版本，否则老客户端可能继续用旧壳。

## 发布后验收

- 打开 `https://<你的项目>.pages.dev/`，首次进入应出现四屏引导。
- 跳过或看完引导后，首页应为空，只显示添加入口；**不应出现任何演示任务**。参考容量引导的跳过与回答都要试一次。
- 刷新后数据仍在（IndexedDB 按 origin 隔离，换域名会得到空库）。
- 设置 → 关于：记录「版本」时间。重新部署一次，刷新或重开应用后该时间必须变化；如果没有变化，按下面的 SW 回滚步骤处理。
- DevTools → Application → Service Workers：`/sw.js` 为 activated，刷新后 controller 存在。
- Network 勾选 Offline 后刷新：仍能打开应用壳。
- 设置 → 到点提醒：授权后开关可开启；关闭后显示「已关闭。」。
- 把页面切到后台，等一个今日计划到点：应收到一次通知；点通知回到应用后，普通页或关闭状态会进入对应拦截。
- 在手机浏览器「添加到主屏幕」，确认 standalone 打开、图标与主题色正常。
- `curl -I https://<你的项目>.pages.dev/assets/<hash>.js`：应只有 `Cache-Control: public, max-age=31536000, immutable`，不能出现 `no-cache`。`vite preview` 不会应用 `_headers`，这一项必须在 Pages 上验。

## 回滚

- Pages 控制台 → Deployments，选择上一个成功的部署 → Rollback。
- 如果是缓存问题，先递增 `public/sw.js` 的 `CACHE` 版本并重新部署，再让用户刷新两次（第一次拿新 SW，第二次由新 SW 控制）。
- 如果新版本部署后真机刷新/重开仍看不到新的「版本」时间，直接移除 `src/main.tsx` 里的 SW 注册（或让 `public/sw.js` 返回 404）并重新部署；对试用版来说，能快速修复比保留离线壳更重要。

## 已知限制

- 通知是 best-effort，依赖浏览器权限、页面是否仍存活和系统通知设置；没有后端 Push，不能保证后台常驻。
- 数据只存在当前浏览器；换设备、清站点数据都会丢失。这是第一版「零后端」的取舍。
- 演示数据只在开发环境种入；生产环境 `seedIfNeeded` 是 no-op，首启就是空库。这样不会让试用者看到不是自己写的内容。
- 试用期先用 `*.pages.dev`，不要为了自定义域名推迟上线；域名是随时可补的，不是发布前置条件。
