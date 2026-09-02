# 实现方案：运动语音播报（Voice Cues）

**Feature Branch**: `004-voice-cues` | **Created**: 2026-09-02 | **Status**: Draft

**输入**: [spec.md](./spec.md) · 基准原型: `design/12-voice-cues.html`（待补充，见 tasks Phase 0）· 章程: `.specify/memory/constitution.md`

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | React Native 0.86 + Expo SDK 57，TypeScript strict | 章程技术约束，沿用 001/002/003 工程 |
| TTS | `expo-speech` | Expo 官方模块，设备本地 TTS，完全离线，中文 `zh-CN` 成熟（澄清 Q1） |
| 触发订阅 | zustand `subscribe`（`stores/trackingStore.ts`） | 后台定位任务保活期间 store 持续更新，订阅回调天然覆盖锁屏场景 |
| 设置存储 | `expo-sqlite`，`settings` 表扩展列（user_version → 3） | 复用 001 既有设置存储模式 |
| 导航 | expo-router v4 | `app/settings/` 已是独立 Stack，新增 `voice-cues.tsx` 子页 |
| 测试 | jest-expo + ts-jest | 章程原则四；`domain/voiceCue` 纯函数单测覆盖 |

**依赖理由登记**（章程原则三要求）：
- `expo-speech`：直接对应 FR-010，官方生态，本地 TTS 零网络请求，`npx expo install expo-speech` 对齐 SDK 57 版本。使用前须阅读 `https://docs.expo.dev/versions/v57.0.0/sdk/speech/`。
- 无其他新增依赖。音频会话精细控制（静音开关/混播）为澄清 Q4 的预留决策点，仅当真机验证不可接受时才引入 `expo-audio`。

## 架构

### 总体结构

```
┌─────────────────────────────────────────────┐
│ UI 层 (app/)                                 │
│  settings/index.tsx 设置列表（新增「语音播报」入口）│
│  settings/voice-cues.tsx 语音播报设置页        │
│  workout 记录流程：启动/停止 voiceCueService   │
├─────────────────────────────────────────────┤
│ 服务层 (services/)                            │
│  voiceCueService.ts: 订阅 store → 判定 → 播报 │
│  settingsRepo.ts: 扩展语音播报设置读写         │
├─────────────────────────────────────────────┤
│ 领域层 (domain/) ← 纯函数，单测覆盖           │
│  voiceCue.ts: 阈值判定 / 文案组装 / 触发合并   │
├─────────────────────────────────────────────┤
│ 原生能力                                      │
│  expo-speech（系统 TTS）                      │
└─────────────────────────────────────────────┘
```

### 关键设计：播报流程

1. **启动**: `services/trackingEngine.ts` 的 `startTracking()` 成功后调用 `voiceCueService.start()`；`resumeAfterKill()` 恢复进行中运动时同样启动。
2. **订阅**: `voiceCueService` 通过 `useTrackingStore.subscribe` 监听 `status / distanceM / durationS / pausedDurationS / sportType` 变化。
3. **判定**: 每次状态变更调用 `domain/voiceCue.ts` 纯函数：
   - 事件播报：由 `start/pause/resume/finish` 生命周期方法直接触发（不经订阅，保证即时性，对应 SC-002）。
   - 距离播报：`distanceM` 跨过 `voice_distance_km` 的整数倍时触发。
   - 时间播报：净时长（`durationS`，store 已扣除暂停）跨过 `voice_time_min` 的整数倍时触发；暂停状态不推进（对应用户故事 3 场景 2）。
4. **合并**: 5 秒窗口内的多个触发合并为一条文案（澄清 Q2）；结束事件优先级最高，撞车时丢弃里程碑播报。
5. **播报**: 调用 `Speech.speak(text, { language: 'zh-CN' })`；新播报到来时先 `Speech.stop()` 再播放，避免排队堆积。
6. **停止**: `finishTracking()` 播放结束播报后调用 `voiceCueService.stop()` 解除订阅。

### 组件与服务设计

#### `domain/voiceCue.ts`（新增，纯函数，单测覆盖）
- `crossedDistanceKm(prevM: number, nextM: number, intervalKm: number): number | null` — 返回跨过的整公里数，未跨过返回 null
- `crossedTimeMin(prevS: number, nextS: number, intervalMin: number): number | null` — 返回跨过的整分钟节点
- `buildEventCue(event: 'start'|'pause'|'resume'|'finish', ctx: CueContext): string`
- `buildDistanceCue(km: number, durationS: number, lastPaceS: number | null, lastSpeedKmh: number | null, sportType: SportType): string`
- `buildTimeCue(minutes: number, distanceM: number): string`
- `mergeCues(cues: Cue[]): string` — 澄清 Q2 合并逻辑；含 finish 时仅保留 finish
- 数字朗读格式复用 `domain/format.ts`（`formatDuration` / `formatPace` / `formatDistance` / `formatSpeed`），禁止另造口径（澄清 Q3）

#### `services/voiceCueService.ts`（新增）
- `start(): Promise<void>` — 读取播报设置，订阅 trackingStore，重置触发器状态
- `stop(): void` — 解除订阅、`Speech.stop()`
- `announceEvent(event)` — 供 trackingEngine 生命周期调用
- 内部维护 `VoiceCueTrigger` 临时状态与 5 秒合并窗口
- 全部调用包裹 try/catch：任何播报异常静默吞掉并打日志，绝不抛向记录链路（FR-011）

#### `services/settingsRepo.ts`（扩展）
- `getVoiceCueSettings(): Promise<VoiceCueSettings>`（缺省返回默认值）
- `updateVoiceCueSettings(patch: Partial<VoiceCueSettings>): Promise<void>`

#### `db/database.ts`（扩展）
- 迁移至 `user_version = 3`：`ALTER TABLE settings ADD COLUMN voice_enabled INTEGER DEFAULT 1` 等 5 列
- 只加列不改表结构语义，对既有数据无损

#### 页面
- `app/settings/index.tsx`: 设置列表新增「语音播报」行（在「数据导出」之后）
- `app/settings/voice-cues.tsx`: 语音播报设置页，对照 `design/12-voice-cues.html`（Phase 0 补充原型；在此之前严格沿用 `design/index.html` 设计规范与 settings 现有行样式）
- `app/workout/*`: 不新增 UI；仅 trackingEngine 生命周期接入播报事件

## 数据模型

`settings` 表扩展（单行 id=1），新增 5 列：

| 列 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `voice_enabled` | INTEGER | 1 | 总开关 |
| `voice_by_distance` | INTEGER | 1 | 按距离播报开关 |
| `voice_distance_km` | INTEGER | 1 | 距离间隔（1/2/5） |
| `voice_by_time` | INTEGER | 1 | 按时间播报开关 |
| `voice_time_min` | INTEGER | 15 | 时间间隔（5/10/15） |

无新增表。`VoiceCueTrigger` 为内存态，不持久化。

## 安全与合规

- **离线优先**: `expo-speech` 使用系统本地 TTS，零网络请求（章程原则一，FR-010）。
- **可靠性**: 播报为旁路订阅，异常静默降级，不增加记录链路崩溃面（章程原则二，FR-011）。
- **隐私**: 播报内容不出设备；无埋点上报。

## 性能策略

- **节流**: 5 秒合并窗口 + `Speech.stop()` 截断旧播报，避免语音堆积。
- **零额外采样**: 判定基于既有 store 更新，不新增定位点、不新增定时器（时间播报复用 store 的 durationS 更新节奏）。
- **电量**: TTS 播报为秒级瞬时调用，对续航影响可忽略；不引入常驻音频会话。

## 错误处理

| 场景 | 策略 |
|---|---|
| TTS 引擎不可用 | 静默降级，日志记录，不影响记录 |
| 设置读取失败 | 使用默认配置继续，记录日志 |
| 播报中收到新事件 | `Speech.stop()` 后播放最新播报 |
| 杀 App 恢复 | `resumeAfterKill()` 中重启 voiceCueService，触发器状态从 store 当前值重建（可能漏报一次已跨过的里程碑，可接受） |
| 暂停期间 | 仅响应 resume/finish 事件播报，距离/时间判定不推进 |

## 章程自查

- ✅ 离线优先：本地 TTS，无网络依赖。
- ✅ 可靠性：旁路设计 + 异常静默，记录链路零侵入；SC-006 回归验证。
- ✅ 简单：一个 domain 纯函数文件 + 一个 service，无状态机库；仅新增 `expo-speech` 一个官方依赖。
- ✅ 测试核心：阈值判定、文案组装、合并逻辑全部纯函数单测；原生 TTS 走真机清单。
- ✅ 原型即真相：设置页需先补 `design/12-voice-cues.html` 原型再实现 UI（tasks Phase 0）。
- ⚠️ 待确认：澄清 Q4 的静音/混播结论可能影响是否追加 `expo-audio`。

## 里程碑任务顺序

`design/12-voice-cues.html` 原型 → `domain/voiceCue` 纯函数与单测 → settings 表迁移 + settingsRepo 扩展 → `voiceCueService` + trackingEngine 接入 → 设置页 UI → 质量门禁 → 真机验证（锁屏播报 / 静音开关 / 音乐混播）。详细拆解见 [tasks.md](./tasks.md)。
