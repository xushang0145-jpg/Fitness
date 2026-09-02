# 实施任务：运动语音播报（Voice Cues）

**Feature**: `004-voice-cues` | **Created**: 2026-09-02

**输入**: [spec.md](./spec.md) · [plan.md](./plan.md) · 原型: `design/12-voice-cues.html`（Phase 0 产出）

---

## Phase 0: 原型补充

- [ ] **0.1** `design/12-voice-cues.html`：语音播报设置页高保真原型
  - 沿用 `design/index.html` 设计规范与 `09-data-export.html` 的设置页行样式：总开关行、按距离播报行（间隔选择 1/2/5 公里）、按时间播报行（间隔选择 5/10/15 分钟）、顶部功能说明
  - **Depends on**: 无 | **Requirement**: 章程原则五，FR-006

---

## Phase 1: 领域层（纯函数 + 单测）

> 每个任务 = 实现 + 对应 Jest 单测，Red-Green 顺序。

- [ ] **1.1** `domain/voiceCue.ts`：阈值判定
  - `crossedDistanceKm` / `crossedTimeMin`；测试：恰好跨界、未跨界、一次跨多档（如 0.9km → 2.1km）、暂停时间已扣除
  - **Depends on**: 无 | **Requirement**: FR-002, FR-003

- [ ] **1.2** `domain/voiceCue.ts`：文案组装
  - `buildEventCue` / `buildDistanceCue` / `buildTimeCue`；测试：三种运动类型（跑步/步行报配速、骑行报速度）、复用 `domain/format.ts` 口径、结束播报含距离与用时
  - **Depends on**: 1.1 | **Requirement**: FR-001, FR-004, FR-005, 澄清 Q3

- [ ] **1.3** `domain/voiceCue.ts`：触发合并
  - `mergeCues`；测试：5 秒窗口内距离+时间合并为一条、含 finish 时仅保留 finish、单触发原样通过
  - **Depends on**: 1.2 | **Requirement**: FR-009, 澄清 Q2

---

## Phase 2: 数据层

- [ ] **2.1** `db/database.ts`：settings 表迁移至 `user_version = 3`
  - `ALTER TABLE settings ADD COLUMN` × 5（`voice_enabled` / `voice_by_distance` / `voice_distance_km` / `voice_by_time` / `voice_time_min`），默认值见 plan 数据模型；验证从 v1/v2 升级路径无损
  - **Depends on**: 无 | **Requirement**: FR-007

- [ ] **2.2** `services/settingsRepo.ts`：语音播报设置读写
  - `getVoiceCueSettings()`（缺省返回默认）/ `updateVoiceCueSettings(patch)`
  - **Depends on**: 2.1 | **Requirement**: FR-007, 用户故事 4 场景 2

---

## Phase 3: 服务层与记录链路接入

- [ ] **3.1** 安装依赖：`npx expo install expo-speech`
  - 对齐 SDK 57 版本；阅读 `https://docs.expo.dev/versions/v57.0.0/sdk/speech/`
  - **Depends on**: 无 | **Requirement**: FR-010

- [ ] **3.2** `services/voiceCueService.ts`：播报编排
  - `start()` / `stop()` / `announceEvent()`；订阅 trackingStore；触发器临时状态与 5 秒合并窗口；全调用 try/catch 静默降级
  - **Depends on**: 1.3, 2.2, 3.1 | **Requirement**: FR-008, FR-011

- [ ] **3.3** `services/trackingEngine.ts`：生命周期接入
  - `startTracking` → `voiceCueService.start()` + 开始播报；`pauseTracking` / `resumeTracking` / `finishTracking` → 对应事件播报；`resumeAfterKill` → 重建 service；finish 播报后 `stop()`
  - **Depends on**: 3.2 | **Requirement**: FR-001, SC-002

---

## Phase 4: UI 与导航

- [ ] **4.1** `app/settings/voice-cues.tsx`：语音播报设置页 [P]
  - 严格对照 `design/12-voice-cues.html`；总开关、按距离/按时间子开关、间隔选择；变更即写入 settingsRepo
  - **Depends on**: 0.1, 2.2 | **Requirement**: FR-006, 用户故事 4

- [ ] **4.2** `app/settings/index.tsx`：设置列表新增「语音播报」入口行
  - 位于「数据导出」之后，push 到 `settings/voice-cues`
  - **Depends on**: 4.1 | **Requirement**: FR-006

---

## Phase 5: 质量门禁与真机验证

- [ ] **5.1** `npx tsc --noEmit` 零错误 + `npm test` 全绿
  - **Depends on**: 1.1, 1.2, 1.3 | **Requirement**: SC-005

- [ ] **5.2** 真机验证清单
  - 锁屏放口袋运动 > 2 公里，每 1 公里听到里程碑播报，漏报 0 次（SC-001）
  - 开始/暂停/继续/结束播报延迟 < 1 秒（SC-002）
  - 总开关关闭后全程静默；子开关独立生效（SC-003）
  - 播报数值与记录页实时显示一致（SC-004）
  - 暂停期间无距离/时间播报；结束撞车仅播结束语
  - 静音开关打开时播报可闻性记录；后台播放音乐时混播表现记录（澄清 Q4，决定是否追加 `expo-audio`）
  - 连续记录 1 小时，记录链路无中断、轨迹无丢失（SC-006）
  - 杀 App 恢复后播报继续可用
  - **Depends on**: 3.3, 4.2, 5.1 | **Requirement**: SC-001~SC-006

- [ ] **5.3** 文档收尾与合并
  - 更新 `spec.md` Status → Done，`plan.md` Status → Final，`tasks.md` 勾选状态
  - 合并 `004-voice-cues` → `main`
  - **Depends on**: 5.2 | **Requirement**: 章程工作流

---

## 备注

- 语音播报只接入自由运动（跑步/骑行/步行），禁止接入跟练课程流程（FR-012）。
- 播报异常一律静默降级，禁止向记录链路抛错（FR-011）；改坏阈值/文案逻辑时必须有单测报警（章程原则四）。
- `[P]` 表示可与同阶段兄弟任务并行；4.1 与 Phase 3 服务层可并行推进。
- 真机验证清单在执行时展开为逐步操作项，结果记录在任务勾选处。
- 本特性为 backlog 晋级候选：spec/plan/tasks 就绪后，待 FIT-2/3/4 验收完成再移交开发启动实现。
