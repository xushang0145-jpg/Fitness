# 实现方案：运动数据导出（GPX / CSV）

**Feature Branch**: `003-data-export` | **Created**: 2026-09-02 | **Status**: Draft

**输入**: [spec.md](./spec.md) · 基准原型: `design/09-data-export.html` · 章程: `.specify/memory/constitution.md`

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | React Native 0.7x + Expo SDK 52，TypeScript strict | 章程技术约束，沿用 001 工程 |
| 导航 | expo-router v4 | 设置页扩展为独立 Stack：`app/settings/index.tsx` + `app/settings/export.tsx` |
| 分享 | `expo-sharing` | Expo 官方模块，无需额外原生依赖，直接唤起系统分享面板 |
| 临时文件 | `expo-file-system` | 官方模块，创建 cache 目录下的临时文件并控制清理 |
| GPX / CSV 生成 | 纯 TypeScript 字符串拼接 | 格式简单，避免引入 XML / CSV 库增加包体积（章程原则三） |
| 坐标转换 | `domain/geo.ts` 新增 `gcj02ToWgs84()` | 数据库为 GCJ-02，GPX 国际标准要求 WGS-84 |
| 测试 | jest-expo + ts-jest | 章程原则四；domain 层纯函数单测覆盖 |

**依赖理由登记**（章程原则三要求）：
- `expo-sharing`：直接对应 FR-008，官方生态，零额外原生配置。
- `expo-file-system`：必须先将生成的字符串写入本地文件 URI，再交给 `expo-sharing`。
- 无其他新增依赖。

## 架构

### 总体结构

```
┌─────────────────────────────────────────────┐
│ UI 层 (app/)                                 │
│  (tabs)/me 我的页                             │
│  settings/index.tsx 设置列表（新增「数据导出」入口）│
│  settings/export.tsx 数据导出页               │
├─────────────────────────────────────────────┤
│ 服务层 (services/)                            │
│  exportService.ts: 查询 → 格式化 → 写临时文件 → 分享│
│  workoutRepo.ts: 复用；补充 listAllDone() / getPoints(id)│
├─────────────────────────────────────────────┤
│ 领域层 (domain/) ← 纯函数，单测覆盖           │
│  geo.ts: 新增 gcj02ToWgs84()                 │
│  gpx.ts: buildGpx(workouts, pointsMap)       │
│  csv.ts: buildCsv(rows)                      │
├─────────────────────────────────────────────┤
│ 原生能力                                      │
│  expo-sharing / expo-file-system             │
└─────────────────────────────────────────────┘
```

### 关键设计：导出流程

1. **入口**: 用户在「我的」页点击「设置与目标」，进入 `settings/index.tsx`；点击「数据导出」push 到 `settings/export.tsx`。
2. **选择格式**: 导出页展示 GPX 与 CSV 两个导出卡片，点击后进入生成中状态。
3. **查询数据**: `exportService` 调用 `workoutRepo.listAllDone()` 获取所有已完成记录，再按需调用 `workoutRepo.getPoints(workoutId)` 批量查询轨迹点。
4. **格式化**: GPX 走 `domain/gpx.ts`，CSV 走 `domain/csv.ts`；GPX 坐标在格式化前经 `domain/geo.gcj02ToWgs84()` 转换。
5. **写临时文件**: 使用 `FileSystem.writeAsStringAsync()` 写入 `FileSystem.cacheDirectory`，文件名带时间戳。
6. **唤起分享**: 调用 `Sharing.shareAsync(fileUri)`，由系统面板处理后续保存/发送。
7. **清理**: 分享回调后删除 cache 中的临时文件；失败时保留以便调试或下次覆盖。

### 组件与服务设计

#### `domain/geo.ts`（扩展）
- `gcj02ToWgs84(lat, lng): { lat, lng }`
- 与现有 `wgs84ToGcj02()` 形成互逆，确保 roundtrip 误差 < 1 米。

#### `domain/gpx.ts`（新增）
- `buildGpx(workouts: Workout[], pointsMap: Map<number, TrackPoint[]>): string`
- 输出符合 GPX 1.1 的 XML 字符串。
- 每条 workout 生成 `<trk>`，包含 `<name>`（如「跑步 2026-09-02」）、`<time>`（ISO 8601 UTC）、`<trkseg>`。
- 轨迹点 `<trkpt>` 按时间升序；海拔缺失时省略 `<ele>`。

#### `domain/csv.ts`（新增）
- `buildCsv(rows: CsvRow[]): string`
- 表头固定：`日期,类型,距离(km),时长(s),卡路里(kcal),平均配速/速度`
- 使用 `\uFEFF` BOM + 换行 `\n`。
- 日期格式 `YYYY-MM-DD`；距离两位小数；卡路里一位小数；配速/速度按类型格式化。

#### `services/exportService.ts`（新增）
- `exportGpx(): Promise<void>`
- `exportCsv(): Promise<void>`
- 职责：调用 repo、调用 domain 格式化、写临时文件、唤起分享、错误处理。
- 暴露 `status: 'idle' | 'generating' | 'sharing' | 'error'` 供 UI 使用。

#### `services/workoutRepo.ts`（扩展）
- 新增 `listAllDone(): Promise<Workout[]>`（按 startTime DESC）
- 新增 `getPoints(workoutId: number): Promise<TrackPoint[]>`（按 timestamp ASC）
- 如 001 已实现等价查询，可直接复用并命名统一。

#### 页面
- `app/settings/index.tsx`: 设置列表页（将原设置 modal 升级为 Stack 入口；保留周目标/体重项，新增「数据导出」行）
- `app/settings/export.tsx`: 数据导出页（对照 `design/09-data-export.html`）

## 数据模型

无新增持久化表；复用 `001-workout-tracking` 的 `workout` 与 `track_point` 表。见 `../001-workout-tracking/data-model.md`。

临时文件 URI 不持久化。

## 安全与合规

- **离线优先**: 导出过程完全在本地执行，无网络请求（章程原则一）。
- **数据归属**: 只读查询，不修改原始记录；用户通过系统面板自主决定文件去向。
- **临时文件**: 写入应用沙盒 cache 目录，分享后清理，不长期保留。
- **权限**: `expo-sharing` 不需要在 `Info.plist` 中声明额外权限；保存到 Files 由系统处理。

## 性能策略

- **批量查询**: 先查 workouts，再批量查 points；避免 N+1 查询。
- **字符串拼接**: GPX 使用数组 join 而不是反复 `+`，减少大字符串拷贝。
- **UI 不阻塞**: 导出过程在 async 函数中执行，生成期间按钮禁用并展示 spinner。
- **大数据 fallback**: 若记录量过大，后续可在 repo 层增加分页导出，但 MVP 不引入。

## 错误处理

| 场景 | 策略 |
|---|---|
| 无运动记录 | 仍生成文件：GPX 为仅含根元素的合法空文件；CSV 为仅表头。UI 显示说明。 |
| 文件写入失败 | `exportService` 捕获异常，状态置 `error`，页面向用户展示「文件生成失败，请重试」 |
| 坐标转换异常 | 单点转换失败时跳过该点并继续；整条记录所有点都失败时仍导出 `<trk>` 元数据 |
| 用户取消分享 | 忽略，返回导出页，状态回到 `idle` |
| 无可用分享目标 | 捕获 `Sharing` 异常并提示「暂无可用的分享应用」 |

## 章程自查

- ✅ 离线优先：无网络，纯本地只读导出。
- ✅ 可靠性：不影响记录链路；导出失败不修改数据。
- ✅ 简单：仅用 Expo 官方模块 + 纯字符串生成，无额外抽象。
- ✅ 测试核心：`domain/geo`、`domain/gpx`、`domain/csv` 纯函数单测覆盖。
- ✅ 原型即真相：页面与 `design/09-data-export.html` 一一对应。

## 里程碑任务顺序

`domain/geo` 反向转换与单测 → `domain/gpx` + `domain/csv` 与单测 → `exportService` + repo 扩展 → 设置 Stack 与导出页 UI → 真机验证。详细拆解见 [tasks.md](./tasks.md)。
