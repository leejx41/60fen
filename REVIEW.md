# 审核说明 · PWA + 到点提醒

> 这是 PWA 阶段的审核记录，保留作历史。最新的「发布前六条建议修复」审核说明在 `review/60-launch-blockers-review.zip` 内的 `REVIEW.md`。


本包对应阶段：在已验收的主应用与四屏引导之上，增加 PWA 安装能力、应用壳离线缓存，以及页面隐藏时的 best-effort 到点通知。

## 审核重点

1. `src/lib/notify.ts`
   - 权限状态：`getNotificationPermission()` / `requestNotificationPermission()`。
   - 通知条件只允许「页面隐藏 + 用户开启 + 浏览器已授权」三者同时成立。
   - 同一计划同一天用 `sixty:notified:<date>:<planId>` 去重，避免 15 秒轮询重复提醒；localStorage 不可用时用模块级 `Set` 兜底，不会每 15 秒重复发。
   - 优先走 Service Worker `showNotification`，便于点击通知后唤醒已打开的标签；无 SW 时用 `new Notification` 兜底。
   - 通知标题/正文来自 `strings.ts`，不在 lib 内硬编码。

2. `src/hooks/useScheduler.ts`
   - 页面隐藏时：只调用一次通知，不创建 intercept、不跳转；计划保持未响应。
   - 页面可见时：才 `openIntercept` 并进入拦截卡；从后台回到前台会补检查。
   - 引导、拦截、分支、夜问、参考容量弹层期间不扫描、不写入拦截记录，避免「已入库但未展示」把计划吞掉。
   - 通知创建后的跳转不再二次检查路由，避免 IndexedDB 写入期间路由变化留下不可见的 intercept（上一轮审核反馈的同类风险）。
   - 夜问的 `sessionStorage` 读写有 try/catch 和内存兜底；存储不可用不会中断 effect 或重复问。

3. `src/screens/SettingsScreen.tsx`
   - 「到点提醒」开关：关闭直接写入 `notify_enabled:false`；默认权限时点击才请求授权；`granted` 才开启。
   - `unsupported` / `denied` 时开关禁用，文案分别说明；已授权但关闭时显示「已关闭。」，不再显示「会提醒一次」。
   - 参考容量步进器不再写 `onboarded`，只改 `capacity_asked`。

4. `public/sw.js`
   - 缓存键 `sixty-shell-v2`，预缓存应用壳与图标，并在 install 时解析 `index.html`，把首屏哈希 JS/CSS 及其 CSS 字体一并加入缓存。
   - 导航 network-first，回退 `/index.html`；同源静态资源 stale-while-revalidate。
   - `notificationclick` 聚焦同源窗口并发送 `SIXTY_NOTIFICATION_CLICK`；无窗口时打开 `/#/today`。已有窗口若停在非普通页，不强制跳转，回到普通页后由调度器补拦截。

5. `public/manifest.webmanifest` 与图标
   - standalone、portrait、`start_url/scope = "/"`，192/512/maskable 图标。
   - `index.html` 增加 manifest、apple-touch-icon 与 iOS meta。
   - `src/main.tsx` 只在生产构建注册 SW；开发环境不注册，避免 HMR 读到旧模块。

## 自检结果

- `npm run typecheck`：通过
- `npm run lint`：通过
- `npm test`：4 个文件、27 个测试通过（新增 6 个通知规则测试，含 localStorage 不可用时的内存去重）
- `npm run build`：通过，98 modules；JS 205.94 kB / gzip 67.14 kB，CSS 49.16 kB / gzip 9.22 kB

### PWA / 离线

- manifest URL `/manifest.webmanifest`，`manifestErrors: []`。
- 生产预览注册 SW，scope `/`、active、controller true；刷新后仍受控。
- `sixty-shell-v2` 共 14 个缓存项，包含 `/index.html`、首屏哈希 JS、CSS 与 4 个字体文件；不再依赖浏览器 HTTP 缓存。
- 断网刷新仍能打开设置页；无 console/pageerror。进一步用 CDP 清空浏览器 HTTP 缓存后断网刷新，仍能打开，说明首屏资源来自 SW 缓存而不是 HTTP 缓存。
- 设置页在权限已授权但用户关闭提醒时显示「已关闭。」，开关 `aria-checked=false`，不再出现「会提醒一次」。
- 图标尺寸：192×192、512×512、maskable 512×512、apple-touch 180×180。

### 隐藏页提醒

用 Playwright 强制 `document.visibilityState = "hidden"`，并 monkeypatch `ServiceWorkerRegistration.prototype.showNotification`：

- 调用次数：1
- title：`到点了`
- body：`撰写方案核心架构。60 分就算数。`
- tag：`sixty:notified:2026-11-09:seed_today_arch`
- data：`{ planId: "seed_today_arch", url: "/#/today" }`
- hidden 时 intercepts = 0、hash 仍为 `#/settings`、未显示拦截卡。
- 切回 visible 并派发 `sixty:check-due` 后，hash 变为 `#/intercept/...`、intercepts = 1。
- 额外把 `localStorage.setItem` 对通知 key 强制抛错，等待两个 15 秒轮询：`showNotification` 仍只有 1 次，内存 Set 兜底生效。

## 已知限制

- 通知是 best-effort：依赖浏览器权限、页面是否仍存活、系统通知设置；不保证后台常驻，也不替代打开应用时的补拦截。
- 只在页面隐藏时发通知；前台由拦截卡本身承担提醒。
- Service Worker 缓存是应用壳级；首次在线加载后，离线刷新可用。缓存键目前为 `v2`，后续静态资源大改时需递增版本。
- 已有窗口停在 onboarding/intercept/branch/night/acted 时，点通知只聚焦并唤醒调度器，不强行打断当前流程；回到普通页后补拦截。
- headless Chrome 的 `getNotifications()` 返回 0，不能作为是否发出的依据；已改用 `showNotification` 调用记录验证。
- `Page.getInstallabilityErrors` 在 headless 无痕环境只报告 `in-incognito`；manifest 本身无错误。持久化非无痕配置因本机 Chrome profile 锁未能完成验证，不是应用侧错误。
- 未实现系统级定时推送（无后端、无 Push 服务），符合技术栈锁定与 PRD 的 E1/E1a 取舍。

## 复核方式

```bash
npm install
npm run dev          # 开发：不注册 SW
npm run build
npm run preview      # 生产：注册 SW，可测离线与通知
```

- 设置 → 到点提醒：授权后开关应变为开启；关闭后不再发通知。
- 开发者工具 → Application → Service Workers：确认 `/sw.js` active。
- Network 勾选 Offline 后刷新：应仍能打开应用壳。
- 把页面切到后台（或隐藏标签），等到某个今日计划到点：应收到一次通知；点通知回到应用后，普通页或关闭状态会进入对应拦截，非普通页回到普通页后补拦截。

## 本包文件

- 新增：`public/manifest.webmanifest`、`public/sw.js`、`public/icon-192.png`、`public/icon-512.png`、`public/icon-maskable-512.png`、`public/apple-touch-icon.png`、`src/lib/notify.ts`、`src/lib/notify.test.ts`
- 修改：`index.html`、`src/main.tsx`、`src/hooks/useScheduler.ts`、`src/screens/SettingsScreen.tsx`、`src/screens/SettingsScreen.module.css`、`src/components/Toggle.tsx`、`src/components/Toggle.module.css`、`src/domain/types.ts`、`src/data/seed.ts`、`src/copy/strings.ts`、`README.md`
- 截图：`screenshots/pwa-settings.png`、`pwa-settings-off.png`、`pwa-settings-320.png`、`pwa-settings-430.png`、`pwa-offline.png`、`pwa-offline-cache.png`、`scheduler-after-skip.png`
