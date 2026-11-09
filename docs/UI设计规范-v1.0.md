# 「60分」执行力 App — UI 设计规范 v1.0

> ## ⚠️ 当前状态（2026-11-09）
>
> **本文档 v1.0 的方案（纸白 + 墨绿 + 零图标 + 零阴影 + 圆角≤12px）暂未执行。**
>
> 产品负责人已确认：第一版采用「**暖琥珀 + 大圆角 + 柔阴影 + 图标 + 照片**」方案，优先保证快速上线验证核心机制。
>
> **开发时以现有代码的实际样式为准，不要按本文档改回去。**
>
> 本文档原文完整保留，作为「零装饰方向」的主张记录，供后续可选改造时参考。
> 决策记录见 `设计决策记录-v1.0.md` 的 D-16。

> **纲领：UI 是舞台，不是演员。**
> 这个产品的价值几乎全在文案上——那句话、「你去了」、被划掉的借口。
> UI 如果抢戏，产品就毁了。

---

## 1. 气质定义

| 要 | 不要 | 原因 |
|---|---|---|
| **安静** | 科技感 | 产品讲的是人的心理，不是技术。科技感会拉开距离 |
| **笃定** | 激励感 | 打气是本产品明确要避免的行为 |
| **有纸感** | 游戏化 | 徽章、等级、连击，产品原则已排除 |

**推导链**：文案的语气是「一个人在耳边说话」→ 视觉必须是「一张纸和一支笔」→ 不是「一块屏幕和一个看板」。

---

## 2. Design Token

直接复制进 `src/styles/global.css`：

```css
:root {
  /* 背景 —— 不用纯白，用暖白（纸感的关键） */
  --bg:             #FBFAF7;
  --surface:        #FFFFFF;   /* 输入框等需要"浮起"的元素 */
  --surface-sunken: #F3F1EA;   /* 强调区块（证词卡、校准句） */

  /* 文字 —— 不用纯黑，用暖黑 */
  --ink:    #1C1B18;   /* 正文、标题 */
  --ink-2:  #5E5B54;   /* 次要文字 */
  --ink-3:  #8B877E;   /* 标签、元信息、时间 */
  --ink-4:  #B5B0A6;   /* 删除线、极弱提示 */

  /* 线 —— 层次靠线，不靠阴影 */
  --line:      #E7E4DB;  /* 描边 */
  --line-soft: #F0EDE5;  /* 分隔线 */

  /* 强调 —— 全站唯一的彩色 */
  --accent:       #1F5C4A;  /* 墨绿：主按钮、可点文字 */
  --accent-deep:  #14453A;  /* 按下态 */
  --accent-wash:  #E9F1EC;  /* 极浅底，慎用 */

  /* 暖色（仅超载提示这类"提醒但非警告"的场景） */
  --warm-wash: #F7F2E4;
  --warm-ink:  #7A6A45;

  /* 圆角 —— 上限 12px，超过就是 AI 味 */
  --r-sm: 6px;
  --r-md: 9px;
  --r-lg: 12px;

  /* 间距 —— 8 的倍数 */
  --s1: 4px;  --s2: 8px;  --s3: 12px; --s4: 16px;
  --s5: 24px; --s6: 32px; --s7: 48px;

  /* 字号阶梯 */
  --t-xs:   11.5px;  /* 标签、元信息、时间 */
  --t-sm:   13px;    /* 辅助说明、次级按钮 */
  --t-base: 14px;    /* 正文、任务名 */
  --t-lg:   17px;    /* 页面标题 */
  --t-xl:   22px;    /* 关键反馈（你去了 / 100 分） */

  /* 行高 —— 中文需要更大的行高 */
  --lh-tight: 1.45;
  --lh-base:  1.75;
}
```

### 2.1 字体

```css
--font: -apple-system, BlinkMacSystemFont, "PingFang SC",
        "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
```

**不引入 Web Font。** 中文字体文件动辄几 MB，首屏加载代价远超收益，且系统字体在中文环境下已经很好。

### 2.2 字重：只用 400 和 500

**禁止 600 / 700。** 两个原因：
1. 中文粗体在屏幕上容易糊成一团
2. 700 是"设计感过强"的信号，与"安静"的气质冲突

---

## 3. 组件规范

### 3.1 主按钮

```css
height: 48px;              /* 拇指友好 */
width: 100%;
background: var(--accent);
color: #FFFFFF;
font-size: var(--t-base);  /* 14px */
font-weight: 500;
border-radius: var(--r-md);/* 9px */
border: none;
box-shadow: none;          /* 永远不加阴影 */
letter-spacing: .02em;
```
按下态：`background: var(--accent-deep)`

**一屏只能有一个主按钮。** 出现两个就等于没有主次。

### 3.2 次按钮

```css
height: 44px;
background: transparent;
color: var(--ink-2);
font-size: var(--t-sm);
border: 0.5px solid var(--line);
border-radius: var(--r-md);
```

### 3.3 文字链

```css
font-size: var(--t-sm);
color: var(--ink-3);
text-decoration: none;
```
需要暗示可点击时：`border-bottom: 0.5px solid var(--line)`

**不用下划线 `text-decoration: underline`**——浏览器默认下划线太粗，会破坏安静感。

### 3.4 输入框

```css
height: 44px;
background: var(--surface);
border: 0.5px solid var(--line);
border-radius: var(--r-md);
padding: 0 14px;
font-size: var(--t-sm);
color: var(--ink);
```
聚焦态：`border-color: var(--ink-4)`。**无外发光、无 box-shadow。**

### 3.5 列表行（计划项）—— 最关键

```css
display: flex;
align-items: center;
height: 56px;
border-bottom: 0.5px solid var(--line-soft);
/* 没有 background、没有 border-radius、没有 box-shadow */
```

内部结构：

| 位置 | 内容 | 规格 |
|---|---|---|
| 左 | 时间 | `width: 46px; font-size: 11.5px; color: var(--ink-3); letter-spacing: .03em` |
| 中 | 任务名 | `flex: 1; font-size: 14px; color: var(--ink)` |
| 右 | 操作 | `font-size: 13px; color: var(--accent)` |

最后一行去掉 `border-bottom`。

> **这一条是去 AI 味的第一招。** 每个 item 一个圆角卡片 + 阴影，是最典型的生成式设计特征。

### 3.6 强调区块（证词卡 / 校准句）

```css
background: var(--surface-sunken);
border-radius: var(--r-lg);      /* 12px */
border: none;                     /* 有底色就别再加描边 */
padding: 18px 20px;
font-size: var(--t-base);
line-height: var(--lh-base);
color: var(--ink);
```

**这是全站唯一允许大面积色块的组件。** 一屏最多一个。

### 3.7 页面标题

```css
font-size: var(--t-lg);   /* 17px */
font-weight: 500;
line-height: var(--lh-tight);
color: var(--ink);
letter-spacing: -.01em;   /* 大字号收紧一点 */
text-align: left;         /* 默认左对齐 */
```

**除反馈屏外一律左对齐。** 居中是 AI 味的重灾区。

### 3.8 区块小标签（如「想做池 · 无上限」）

```css
font-size: var(--t-xs);   /* 11.5px */
color: var(--ink-3);
letter-spacing: .05em;    /* 小字号要放开，否则会糊在一起 */
```

### 3.9 底部固定操作区

与内容之间用 `border-top: 0.5px solid var(--line-soft)` 分隔。
底部内边距：`calc(12px + env(safe-area-inset-bottom))`。

**不用 `box-shadow` 做浮起效果。**

### 3.10 空态

```css
font-size: var(--t-sm);
color: var(--ink-3);
line-height: var(--lh-base);
```

文案要具体、有温度，不写"暂无数据"。

正确示例：`空的。想到什么可以先扔进来，不用挑时候。`

---

## 4. 动效

| 场景 | 规格 |
|---|---|
| 页面切换 | `opacity 0→1` + `translateY(6px→0)`，180ms，`ease-out` |
| 拦截卡出现 | 同上，200ms |
| 删除线划出 | 200ms，`transform: scaleX(0→1)`，`transform-origin: left` |

**禁止清单**：
- ❌ 弹簧 / 回弹曲线（`cubic-bezier(.68,-0.55,.27,1.55)` 这类）
- ❌ 缩放弹跳、位移动画超过 8px
- ❌ 超过 300ms 的动效
- ❌ 渐变颜色流动、光晕呼吸
- ❌ 打字机效果

必须尊重 `prefers-reduced-motion`：
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 5. 图标策略：零图标

**这个产品不使用任何图标。**

理由：
1. 所有操作都能用文字表达：「满分」「今天做」「我去了」「就做这段话」
2. 图标是系统语言，文字是人的语言。本产品的全部气质建立在"像一个人在说话"上
3. 零图标方案本身极不像 AI 生成的设计

**唯一例外**：新增入口用全角加号「＋ 添加」，它是文字不是图标。

---

## 6. 避雷清单 A：AI 味

看到任何一项，立即改掉。

| ❌ | 为什么 |
|---|---|
| 紫 / 蓝紫渐变背景 | 最典型的"AI 生成色" |
| 玻璃拟态（`backdrop-filter: blur`） | 2020 年流行过，现在是 AI 味标志 |
| 发光边框 / 霓虹色 | 与"安静"完全相反 |
| 卡片内部再套卡片 | 层次感应该来自间距，不是嵌套 |
| 每个模块都加一块背景色 | 一屏最多一个色块 |
| emoji 当图标 | 🎯🔥✨ 这类是 AI 文案的标志性痕迹 |
| 圆角 ≥ 16px | 超过 12px 就开始"软"，与本产品气质不符 |
| 阴影（`box-shadow`） | 全站零阴影，层次靠 0.5px 描边和留白 |
| 渐变按钮 | 用纯色。渐变会显得不自信 |
| 居中大标题 + 副标题 + 三栏特性 | 这是落地页模板，不是应用界面 |
| 深色背景 + 霓虹强调色 | "科技感"的标准配方，本产品明确排除 |
| 进度环 / 仪表盘 / 雷达图 | 产品不做量化成就 |
| 加载骨架屏闪烁 | 这个产品没有网络请求，不需要 |

---

## 7. 避雷清单 B：过时

| ❌ | 年代感 |
|---|---|
| 拟物化纹理（皮革、木纹、纸张纹理贴图） | 2013 年前 |
| 重投影 + 描边 + 渐变三者同时用 | 2010 年代初 |
| 蓝色主色（#007AFF / #1890FF）配浅灰背景 | 企业后台 / 2015 年移动应用 |
| 药丸按钮（`border-radius: 999px`）+ 强阴影 | 2015–2017 |
| 纯线性图标 + 圆角卡片列表 | 2018 年前后的通用模板 |
| 大圆角 + 磨砂玻璃（新拟态残留） | 2019–2021 |

**共同点**：它们都是当时"流行"的选择，所以现在看是某个年代的化石。

**这套规范为什么不会过时**：它不追任何潮流，只用了两个不会过时的东西——**排版和留白**。

---

## 8. 发布前自检清单

任何一个界面上线前逐条过：

- [ ] 背景是 `--bg` 暖白，不是纯白
- [ ] 文字是 `--ink` 暖黑，不是纯黑
- [ ] 全屏没有 `box-shadow`
- [ ] 圆角最大 12px
- [ ] 只有一处主按钮
- [ ] 一屏最多一个色块（`--surface-sunken`）
- [ ] 列表项没有卡片背景，只有分隔线
- [ ] 没有图标、没有 emoji
- [ ] 除反馈屏外全部左对齐
- [ ] 字重只有 400 / 500
- [ ] 所有文案来自 `copy/strings.ts`，没有硬编码
- [ ] 在 320px 宽度下不出现横向滚动

---

## 9. 与现有原型的关系

`docs/60分执行力App-交互原型.html` 里的配色是这套规范的**近似值**（当时用的是 `#0F6E56` / `#14624C`）。

开发时**以本文档为准**：`--accent: #1F5C4A`。

原型用于验证流程和文案，不用于确认视觉。两者不冲突，但不要拿原型里的色值当标准。

---

## 10. 一句话总结

> **暖白纸、暖黑字、0.5px 细线、一个墨绿、零图标、零阴影、全部左对齐。**
> **靠排版和留白建立层次，不靠装饰。**

---

*v1.0 · 与 PRD v2.2、技术栈锁定 v1.0 配套*
