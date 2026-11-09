# 「60分」执行力 App — 技术方案 v1.0

> 目标：**一周内产出一个能发给 3–4 人试用的公网版本**
> 前置文档：PRD v2.2、交互原型
> 面向：计算机专业大三，个人项目，同时想学到东西

---

## 0. 决策摘要

| 决策点 | 选择 | 一句话理由 |
|---|---|---|
| 数据存储 | **浏览器本地（IndexedDB）** | 一周能上线，零后端，不碰试用者隐私 |
| 数据互通 | **不做**，改为导出/导入 JSON | 试用期两周，跨设备不是真需求 |
| 部署 | **Cloudflare Pages**（备选国内对象存储） | 免费、自动部署、国内可访问 |
| 推送 | **打开应用时补拦截** | 网页做不到可靠后台推送，且补拦截其实更符合真实行为 |
| 前端 | Vite + React + TypeScript | 你已经会，不为项目学新框架 |
| 样式 | 原生 CSS + CSS 变量 | 产品价值 90% 在文案与流程，不在视觉；少一层学习成本 |
| 状态 | zustand（或 `useState` + context） | 项目小，不上 Redux |

**核心原则**：第一版所有复杂度都要让位给"能发出去、能被真实使用两周"。

---

## 1. 三个关键决策的详细说明

### 1.1 为什么不做后端

"发给 3–4 个人用一段时间"听起来需要后端，其实不然：

| 需求 | 是否需要后端 |
|---|---|
| 每个人能独立使用 | ❌ 各自的浏览器天然隔离 |
| 试用者换手机继续用 | ❌ 两周试用期不是真需求 |
| 你在后台看他们的数据 | ⚠️ 想要，但涉及隐私，且**你其实不该看** |
| 数据不丢 | ⚠️ 这是唯一真实风险，用导出缓解 |

**结论**：不做后端。你换来的是 3–5 天开发时间、零运维、零成本，以及一句可以对试用者说的话——**"你的数据只在你自己手机上，我看不到"**。这句话会显著提高别人愿意试用的概率。

### 1.2 数据会丢，怎么缓解

浏览器本地存储的三个失效场景：
1. 用户清浏览器缓存
2. 换设备 / 换浏览器
3. iOS Safari 长期不访问站点会自动清理站点数据（这个最容易踩）

**三层缓解**：
1. **应用内明确告知**（首次进入 + 设置页）："数据存在这台设备上，别清缓存；换设备前先导出。"
2. **提供导出/导入**：一键导出 JSON 文件，可发给作者，也可自己换设备时导入。
3. **引导加到主屏幕**：iOS Safari 里"添加到主屏幕"后的 Web App 数据被清理的概率明显更低。

> **诚实的取舍**：这三层不能完全消除风险。如果试用者第三周反馈"数据没了"，那是这个方案的固有代价，不是 bug。要在试用说明里提前讲清。

### 1.3 推送做不到，用"补拦截"替代

网页在手机后台会被系统回收，定时器不可靠，iOS 对 Web Push 限制尤其严格。

**替代设计（已写入 PRD E1a）**：

```
用户打开应用
    │
    ▼
检查：是否有「已到期且当日未响应」的今日池计划？
    │
    ├─ 有 → 立刻展示拦截卡（这就是补拦截）
    └─ 无 → 正常进今日池
```

**这个替代不是妥协**：人早上第一件事就是拿手机，主动打开应用的概率远高于点开系统通知。

**可选增强（P2，别放第一版）**：应用在前台时用 `Notification` API 提醒；或引导用户给自己的手机设一个闹钟。

---

## 2. 技术栈

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.5",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "typescript": "^5.5.0",
    "@vitejs/plugin-react": "^4.3.1"
  }
}
```

**说明**：
- **不引入日期库**：本产品所有时间都是 `HH:MM` 字符串或 `YYYY-MM-DD` 日期串，原生 `Date` 足够。少一个依赖少一个坑。
- **不引入 UI 库**：产品视觉极简，原生 CSS 更快也更可控。
- **`idb`**：IndexedDB 的原生 API 太啰嗦，这个库只有 2KB，学一次受益很久（正好对应你专业课里的浏览器存储机制）。

---

## 3. 项目结构

```
60fen/
├── public/
│   └── manifest.webmanifest        # PWA，用于"添加到主屏幕"
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts                    # 所有类型定义（唯一真相源）
│   ├── db/
│   │   ├── index.ts                # IndexedDB 初始化、schema 版本管理
│   │   └── repo.ts                 # 【关键】数据访问层，未来换云端只改这里
│   ├── logic/
│   │   ├── intercept.ts            # 补拦截引擎
│   │   ├── reason.ts               # 理由归一化 + 指纹
│   │   ├── testimony.ts            # 证词计算
│   │   └── capacity.ts             # 参考容量 + 超载提示
│   ├── store/
│   │   └── useApp.ts               # zustand store
│   ├── screens/
│   │   ├── Home.tsx                # 今日池 / 想做池
│   │   ├── AddPlan.tsx             # 添加今日计划
│   │   ├── AddWish.tsx             # 放进想做池
│   │   ├── Intercept.tsx           # 【核心】拦截卡
│   │   ├── BranchA.tsx             # 拆解页
│   │   ├── BranchBCD.tsx           # 放行页
│   │   ├── Acted.tsx               # 正向反馈
│   │   ├── FullScore.tsx           # 满分反馈
│   │   ├── NightCheck.tsx          # 当晚一问
│   │   └── Settings.tsx            # 设置 + 导出/导入
│   ├── copy/
│   │   └── strings.ts              # 【关键】所有文案集中管理
│   └── styles/
│       └── global.css
├── index.html
├── package.json
└── vite.config.ts
```

**两个必须坚持的结构决定**：

1. **`copy/strings.ts`**：PRD 附录 13 那份文案表直接变成这个文件。**所有界面文字都从它取，不允许在组件里硬编码字符串。** 这样才能保证"改文案不用改代码"，也能保证 PRD 与实现永远一致。
2. **`db/repo.ts`**：所有读写都走这一层，组件不直接碰 IndexedDB。未来换 Supabase 时，只改这一个文件和它的实现，业务代码零改动。

---

## 4. 数据模型

### 4.1 类型定义（`src/types.ts`）

```ts
export type Pool = 'today' | 'wish';
export type PlanStatus = 'active' | 'deferred' | 'passed' | 'done';
export type Branch = 'A' | 'B' | 'C' | 'D' | 'went';
export type ReasonType = 'tag' | 'free' | null;
export type TestimonyAnswer = 'glad' | 'should' | 'unsure';

export interface Plan {
  id: string;
  title: string;
  scheduledAt: string | null;      // "HH:MM"；想做池为 null
  downgradeAction: string | null;
  pool: Pool;
  status: PlanStatus;
  fullScore: boolean;             // 是否标记满分（同时视为完成）
  createdDate: string;            // "YYYY-MM-DD"
  createdAt: number;
}

export interface Intercept {
  id: string;
  planId: string;
  date: string;                   // "YYYY-MM-DD"
  reasonText: string | null;      // 用户原话
  reasonType: ReasonType;         // tag / free / null
  reasonKey: string | null;       // 【关键】"tag:A" 或 归一化原话
  branch: Branch;                 // 走了哪条处理路径
  shownAt: number;
  resolvedAt: number | null;      // null = 未响应
  actionTaken: boolean;
}

export interface Testimony {
  id: string;
  interceptId: string;
  date: string;
  answer: TestimonyAnswer;
  createdAt: number;
}

export interface Settings {
  refCapacity: number;            // 默认 3
  testimonyEnabled: boolean;      // 默认 true
  overloadHintDate: string | null;// 【关键】哪天已提示过超载，实现"每日一次"
  onboarded: boolean;
}
```

### 4.2 关键设计说明

**`branch` 与 `reasonKey` 必须分开**（PRD 7.3）：

| 字段 | 记什么 | 例子 |
|---|---|---|
| `branch` | 走了哪条处理路径 | 写自由理由的人也走 `A`（因为要进拆解页） |
| `reasonKey` | 这条理由归谁 | 写自由理由的人：归一化后的原话；点标签的人：`tag:A` |

**如果为了省事把 `reasonKey` 填成 `branch`**，系统就会给一个写"1111111"的用户展示"我怕今天做不好"的历史统计——编造归类。

**`overloadHintDate`**：用一个日期字符串实现"每日至多一次"，比搞一个"上次提示时间戳 + 24小时判断"简单得多，也不会有跨天边界问题。

### 4.3 IndexedDB Schema

```
数据库名: 60fen
版本: 1

objectStore: plans
  keyPath: id
  index: pool          → 按池子查询
  index: createdDate   → 按日期查询

objectStore: intercepts
  keyPath: id
  index: planId
  index: date
  index: reasonKey     → 【关键】证词统计靠它

objectStore: testimonies
  keyPath: id
  index: interceptId   → 一对一

objectStore: settings
  keyPath: 'singleton'  （只有一条记录，key 固定为 'singleton'）
```

---

## 5. 核心逻辑与边界条件

### 5.1 理由归一化（`logic/reason.ts`）

```ts
export function normalizeReason(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, '')                        // 去掉所有空白
    .replace(/[，。！？、；：""''（）,.!?;:()"']/g, '')  // 去掉中英文标点
    .toLowerCase();
}

export function buildReasonKey(
  reasonType: ReasonType,
  branch: Branch,
  reasonText: string | null
): string | null {
  if (reasonType === 'tag') return `tag:${branch}`;
  if (reasonType === 'free' && reasonText) return normalizeReason(reasonText);
  return null;
}
```

**边界条件（必须写测试）**：
- `"太累了。"` 与 `"太累了"` → 归一化后相同 ✓
- `"太 累 了"` → 相同 ✓
- `"太累了"` 与 `"有点累"` → 不同（不做语义相似度，这是刻意为之）
- 空字符串 / 全空白 → 返回 `""`，此时不应创建 `reasonKey`

### 5.2 补拦截引擎（`logic/intercept.ts`）

```ts
/** 返回当前应该立刻展示的拦截卡；没有则返回 null */
export function getPendingIntercept(
  plans: Plan[],
  intercepts: Intercept[],
  today: string,        // "YYYY-MM-DD"
  nowHHMM: string       // "HH:MM"
): Plan | null {
  const respondedToday = new Set(
    intercepts.filter(i => i.date === today && i.resolvedAt !== null).map(i => i.planId)
  );

  return plans.find(p =>
    p.pool === 'today' &&
    p.status === 'active' &&
    !p.fullScore &&
    p.scheduledAt !== null &&
    p.scheduledAt <= nowHHMM &&          // 已到点
    !respondedToday.has(p.id)            // 今天还没响应过
  ) ?? null;
}
```

**边界条件**：
- 已到点但当日已响应过 → 不再拦截（这是"当日不重复打扰"的实现）
- 有多件同时到点 → 一次只拦一件，处理完再拦下一件
- `"09:00" <= "22:00"` 字符串比较成立，因为 `HH:MM` 等长
- 午夜跨天：`today` 变了，`respondedToday` 自然清空，无需额外的"重置"逻辑

### 5.3 证词计算（`logic/testimony.ts`）

```ts
export interface TestimonyResult {
  total: number;      // 该 reasonKey 今年累计次数
  should: number;     // 事后认为该去的次数
  glad: number;       // 事后认为幸好没去的次数
  shouldShow: boolean;// 是否达到展示门槛
}

export function calcTestimony(
  reasonKey: string,
  intercepts: Intercept[],
  testimonies: Testimony[],
  year: string        // "2026"
): TestimonyResult {
  const hits = intercepts.filter(
    i => i.reasonKey === reasonKey && i.date.startsWith(year)
  );
  const answers = hits
    .map(i => testimonies.find(t => t.interceptId === i.id))
    .filter(Boolean) as Testimony[];

  return {
    total: hits.length,
    should: answers.filter(t => t.answer === 'should').length,
    glad: answers.filter(t => t.answer === 'glad').length,
    shouldShow: [3, 5, 8].includes(hits.length)   // 只在 3/5/8 次触发
  };
}
```

**边界条件**：
- `total` 统计的是**全部** `reasonKey` 命中次数，不是"有证词的次数"
- 门槛判断用 `total`，展示的数字用 `should` / `glad`
- `glad === 0` 时，卡片只显示"其中 N 次你后来觉得该去"，不显示"另外 0 次"
- 跨年重置：`date.startsWith(year)`，次年自动归零（刻意的，别做成"今年累计"变成"永久累计"）

### 5.4 当晚一问候选（`logic/testimony.ts`）

```ts
export function getNightCheckPlans(
  intercepts: Intercept[],
  testimonies: Testimony[],
  today: string,
  enabled: boolean
): Intercept[] {
  if (!enabled) return [];
  const answered = new Set(testimonies.map(t => t.interceptId));
  return intercepts.filter(i =>
    i.date === today &&
    !i.actionTaken &&                      // 未行动
    (i.branch === 'A' || i.branch === 'D') &&  // 只在 A/D
    i.resolvedAt !== null &&               // 已做选择（未响应的不算）
    !answered.has(i.id)                    // 还没问过
  );
}
```

**边界条件（PRD 7.8 的硬规则）**：
- `branch === 'B'`（有更要紧的事）→ **不问**
- `branch === 'C'`（身体不舒服）→ **不问**
- `actionTaken === true` → **不问**
- `resolvedAt === null`（直接退出）→ **不问**

### 5.5 超载提示（`logic/capacity.ts`）

```ts
export function shouldShowOverload(
  todayCount: number,
  refCapacity: number,
  settings: Settings,
  today: string
): boolean {
  return todayCount > refCapacity && settings.overloadHintDate !== today;
}
```

关闭时写入 `settings.overloadHintDate = today`，实现"每日至多一次"。

---

## 6. 文案管理（`src/copy/strings.ts`）

PRD 附录 13 直接变成这个文件。示例：

```ts
export const S = {
  intercept: {
    question: '今天你大概会用什么理由不去？',
    group1: '用你自己的话说',
    placeholder: '一句话就行',
    submit: '就这段话，继续',
    group2: '或者，挑一句最像的',
    tagA: '我怕今天做不好',
    tagB: '我今天有更要紧的事',
    tagC: '我身体确实不舒服',
    tagD: '我说不清，就是不想动',
    primary: '我去了',
  },
  calibration: (task: string) =>
    `你在比较「${task} 60 分的效果」和「${task} 100 分的效果」。\n但今天真实的选择是「${task} 60 分的效果」和「0」。`,
  testimonyTag: (tag: string, total: number, should: number, glad: number) =>
    `「${tag}」这个理由，你今年用过 ${total} 次。` +
    `其中 ${should} 次，你后来觉得其实该去。` +
    (glad > 0 ? `另外 ${glad} 次，你觉得幸好没去。` : ''),
  // ...
};
```

**铁律**：组件里不允许出现任何中文字符串字面量。想改一句话，只改这个文件。

---

## 7. 部署（发给别人测试的关键步骤）

### 7.1 一次配置，之后自动部署

```bash
# 1. 本地能跑
npm create vite@latest 60fen -- --template react-ts
cd 60fen && npm i && npm run dev

# 2. 推到 GitHub
git init && git add -A && git commit -m "init"
gh repo create 60fen --public --source=. --push

# 3. Cloudflare Pages 连这个仓库
#    Build command: npm run build
#    Output directory: dist
# 4. 得到 https://60fen.pages.dev → 直接发给试用者
```

### 7.2 国内访问的现实问题（必须提前处理）

| 平台 | 国内访问 | 备注 |
|---|---|---|
| Vercel `*.vercel.app` | ❌ 经常很慢/打不开 | 不推荐给国内试用者 |
| Netlify `*.netlify.app` | ⚠️ 不稳 | — |
| **Cloudflare Pages `*.pages.dev`** | ✅ 基本可用 | 首选 |
| GitHub Pages | ⚠️ 时快时慢 | 备选 |
| 国内对象存储（OSS/COS 静态托管） | ✅ 最快 | 需实名，配置略多 |

**建议**：先用 Cloudflare Pages。发出去前**自己用手机流量测三次**，确认能打开再发给别人。打不开就换对象存储。

### 7.3 试用前必须加的页面

一个极简的「关于」页，写清三件事：

1. 这是个试用版，只做了一条核心链路
2. **数据存在你自己手机上**，我看不到；别清浏览器缓存
3. 有问题随时找我，尤其是"哪一步你觉得别扭"

第 3 条最重要——**试用期最有价值的反馈是"哪里别扭"，不是"好不好用"**。

---

## 8. 一周任务拆解

### Day 1–2：地基
- [ ] Vite + TS 项目初始化
- [ ] `types.ts` 写全
- [ ] `db/index.ts` + `repo.ts`（IndexedDB 封装）
- [ ] `copy/strings.ts` 灌入 PRD 文案
- [ ] **部署一次 Hello World 到 Cloudflare Pages**（一定要在第 1 天做）

### Day 3–4：最窄的垂直切片
只做三步：**建计划 → 打开时补拦截 → 点「我去了」**
- [ ] Home（今日池列表 + 时间排序）
- [ ] AddPlan
- [ ] Intercept（有输入框 + 4 个入口 + 我去了）
- [ ] Acted（划掉理由 + 累积计数）
- [ ] **自己用一天**

### Day 5–6：四个分支 + 当晚一问 + 证词
- [ ] BranchA（校准句 + 降档动作 + 证词卡）
- [ ] BranchB / C / D
- [ ] NightCheck
- [ ] FullScore
- [ ] 想做池 + 移动补时间

### Day 7：收尾与分发
- [ ] Settings（参考容量、证词开关、导出/导入）
- [ ] 「关于」页 + 试用说明
- [ ] 移交给 3–4 个试用者
- [ ] 写一篇简短的试用说明发给他们

---

## 9. 测试清单（重点测边界）

**理由指纹**
- [ ] `"太累了。"` 与 `"太累了"` 归一化后相同
- [ ] 空理由无法提交
- [ ] 超过 20 字被截断

**补拦截**
- [ ] 到点后打开应用，弹出拦截卡
- [ ] 已响应过的计划当日不再弹
- [ ] 多件同时到点，一次只弹一件

**当晚一问**
- [ ] 分支 B / C 的计划不进入候选
- [ ] 已行动的计划不进入候选
- [ ] 直接退出的（未响应）不进入候选

**证词**
- [ ] 第 3 次命中才展示，第 4 次不展示，第 5 次展示
- [ ] `glad = 0` 时不显示"另外 0 次"
- [ ] 写自由理由的人**不会**看到标签证词卡

**跨天**
- [ ] 手动改系统时间到次日，确认拦截可再次触发、超载提示已重置

**存储**
- [ ] 导出 JSON 能成功下载
- [ ] 导入后数据完整

---

## 10. 风险与回退

| 风险 | 影响 | 回退 / 缓解 |
|---|---|---|
| 试用者清缓存丢数据 | 高 | 应用内提示 + 导出 + 加到主屏幕 |
| Cloudflare 国内访问不稳 | 高 | 备用方案：国内对象存储静态托管 |
| 一周做不完 | 中 | **砍分支 C/D**，只留 A + 我去了 + 证词，其余第二版 |
| 时间不够又想收集真实数据 | 中 | 第二版接 Supabase（repo.ts 已留好切换口） |
| 试用者有 0 反应 | 中 | 这不一定是产品问题，先确认他们是否真的打开过 |

---

## 11. 什么时候该上后端

出现以下任一信号，就该接 Supabase（免费额度对 4 人足够）：

- 试用者反馈"换了手机数据没了"且仍愿意继续用
- 你想看真实的聚合指标（理由填写率、拆解转化率）
- 开始有第 10 个以上的用户

**切换成本很低**：只需实现一个新的 `repo.ts`，业务代码不动。这就是第 3 节把它单独抽出来的原因。

---

*配套文档：PRD v2.2、交互原型、开发流程与路线图*
