import type { Branch } from "@/domain/types";

export const BRANCH_LABEL: Record<Exclude<Branch, "went">, string> = {
  A: "我怕今天做不好",
  B: "我今天有更要紧的事",
  C: "我身体确实不舒服",
  D: "我说不清，就是不想动",
};

export const COPY = {
  appName: "60分",
  todayPool: "今日池",
  somedayPool: "想做池",
  settings: "设置",
  today: "今天",

  addToday: "+ 添加",
  addTodayTitle: "添加一件事",
  titleLabel: "这件事是什么",
  titlePlaceholder: "例如：晨间慢跑 2 公里（20字以内）",
  required: "必填",
  optional: "选填",
  timeLabel: "什么时候做",
  timePlaceholder: "选择具体时刻，例如 07:00",
  timeHint: "时间必填。到点才会有人来问你那一句。",
  stepLabel: "最没阻力的一步",
  stepPlaceholder: "例如：穿上跑鞋，到楼下走五分钟",
  stepHelper:
    "「最没阻力的一步」写的是：等你不想动的时候，只要做这一件就算数。判断标准：这一步能不能被\"今天状态不好\"这个理由否掉？否不掉，就对了。",
  cancel: "算了",
  saveToday: "放进今天",
  savePool: "先放着",

  poolAddTitle: "放进想做池",
  poolSubcopy: "不问时间。想到什么先放着，等它变成「今天要做」的时候再说。",
  poolEmpty: "空的。想到什么可以先扔进来，不用挑时候。",
  moveToToday: "今天做",
  moveTimeQuestion: "「{任务}」什么时候做？",

  overload: (count: number, capacity: number) =>
    `今天第 ${count} 件。你最近一周实际做完的是 ${capacity} 件。`,

  interceptTitle: "今天你大概会用什么理由不去？",
  interceptFirstHint: "说实话就行，它不会评价你。",
  ownWords: "用你自己的话说",
  reasonPlaceholder: "一句话就行",
  submitReason: "就这段话，继续",
  pickOne: "或者，挑一句最像的",
  goThere: "我去了",

  testimonyTag: (label: string, total: number, regret: number, glad: number) =>
    `「${label}」这个理由，你今年用过 ${total} 次。其中 ${regret} 次，你后来觉得其实该去。${
      glad > 0 ? `另外 ${glad} 次，你觉得幸好没去。` : ""
    }`,
  testimonyFree: (reason: string, total: number, regret: number) =>
    `「${reason}」这句话，你说过 ${total} 次。其中 ${regret} 次，你后来觉得其实该去。`,
  testimonySource: "这些数字来自你每晚回答的那个问题。随时可以在设置里关掉。",

  calibration: (task: string) =>
    `你在比较「${task} 60 分的效果」和「${task} 100 分的效果」。但今天真实的选择是「${task} 60 分的效果」和「0」。`,
  downgradePrefix: "它管不到的事：",
  doThis: "就做这个",
  notToday: "今天不做了",

  branchB: "好，记下了。这件事我先放回想做池，它不会跑，你也不用惦记。",
  branchBButton: "知道了",
  branchC: "今天就别去了。这不是借口。",
  branchCButton: "好好休息",
  branchD: "好，那不找了。有时候就是不想动，这不用解释。",

  acted: "你去了。",
  actedCount: (count: number) => `今年第 ${count} 次。把「不去」改成「去了」。`,
  actedButton: "好",

  fullScore: "满分",
  fullScoreMarked: "100",
  fullScoreFeedbackTitle: "100 分。",
  fullScoreFeedbackBody: "这次你做得很好。",

  nightQuestion: "早上那个决定，现在你怎么看？",
  nightOptions: ["幸好没去", "其实该去的", "说不好"] as const,
  nightSkip: "这次不说了",

  capacityQuestion:
    "你一天大概能认真做完几件？这不是上限，只用来和实际做个对照。随时能改。",
  capacityFinal:
    "欲望越多，焦虑越多。人的精力是有限的——写下来的时候多问一句：今天真的做得完吗？",
  capacitySkip: "先跳过",
  capacitySave: "这样就好",

  onboardingSkip: "跳过",
  onboardingNext: "继续",
  onboardingStart: "开始",
  onboardingPage: (page: number) => `${String(page).padStart(2, "0")} / 04`,
  onboardingOne: [
    "每天都有很多事想做。",
    "但总有一些，",
    "一直停在“想做”。",
  ] as const,
  onboardingTwoLead: "不是因为你懒。",
  onboardingTwoWait: "是因为你在等——",
  onboardingTwoWaits: [
    "等条件再好一点，",
    "等计划再周全一点，",
    "等自己有把握一点。",
  ] as const,
  onboardingTwoMissed: "而那个时刻一直没来。",
  onboardingTwoVerdict: "你只是，一直在准备开始。",
  onboardingThreeQuestion: "有没有算过这笔账：",
  onboardingThreeStatement:
    "一件做到 100 分的力气，够你做五件 60 分的。",
  onboardingThreeOne: "一件做到 100 分",
  onboardingThreeFive: "五件各 60 分",
  onboardingFourTitle: "所以 60 分就够了。",
  onboardingFourLines: [
    "不是因为它容易，",
    "是因为它现在就能开始。",
  ] as const,

  settingsCapacity: "参考容量",
  settingsCapacityHint: "只用来和实际做个对照。",
  settingsCapacitySkippedHint: "已跳过，不做超载提示。",
  settingsTestimony: "事后证词",
  settingsTestimonyHint: "当晚一问，以及第 3/5/8 次举证。",
  settingsNotifications: "到点提醒",
  settingsNotificationsOn: "已开启。应用不在前台时，到点会提醒一次。",
  settingsNotificationsOff: "已关闭。",
  settingsNotificationsDenied:
    "浏览器已拒绝通知权限，可在浏览器设置中重新开启。",
  settingsNotificationsUnsupported: "当前浏览器不支持系统通知。",
  notificationTitle: "到点了",
  notificationBody: (title: string) => `${title}。60 分就算数。`,
  settingsDebug: "调试",
  settingsDebugHint: "仅开发环境可见。",
  settingsAbout: "关于",
  settingsAboutBody: "60 分：只要做完这一件，就算数。",
  settingsVersion: (id: string) => `版本 ${id}`,
  settingsReplay: "再看一遍引导",
  settingsReplayHint: "重看不会改变任何记录。",
  settingsResetConfirm: "重置为演示数据？当前记录会被清空。",
  settingsNoMorePlans: "今天后面没有待触发的计划了。",
  enable: "开启",
  disable: "关闭",
} as const;

export const UI_LABELS = {
  back: "返回",
  backToday: "返回今日池",
  close: "关闭",
  clear: "清空",
  settings: "设置",
  todayTitle: "今天",
  somedayTitle: "想做池",
  add: "添加",
  save: "保存",
  decreaseCapacity: "减少参考容量",
  increaseCapacity: "增加参考容量",
  devTools: "开发工具",
  resetDemo: "重置演示数据",
  previewIntercept: "预览拦截卡",
  advanceClock: "快进到下一件事",
} as const;
