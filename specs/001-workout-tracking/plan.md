# 实现方案：运动记录（跑步 / 骑行 / 步行）

**Feature Branch**: `001-workout-tracking` | **Created**: 2026-09-01 | **Status**: Draft

**输入**: [spec.md](./spec.md) · 基准原型: `design/01~04` · 章程: `.specify/memory/constitution.md`

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | React Native 0.7x + Expo SDK 52+，TypeScript strict | 章程技术约束 |
| 构建 | **Expo Dev Client（development build）** | 高德原生 SDK 无法用 Expo Go，必须 prebuild |
| 导航 | expo-router v4（文件路由，底部 Tabs + Stack） | 章程技术约束 |
| 状态 | zustand | 轻量；记录引擎状态与 UI 解耦 |
| 地图 | react-native-amap3d（高德） | 澄清 Q1；双端 GCJ-02 合规不偏移 |
| 定位 | expo-location（前台 watch + 后台 task） | 章程技术约束 |
| 存储 | expo-sqlite（原生 SQLite，事务支持） | 轨迹点高频写入，SQL 可靠 |
| 图表/圆环 | react-native-svg（手绘 SVG） | 进度环、配速曲线、柱状图均为简单 SVG |
| 测试 | jest-expo + ts-jest（纯逻辑单测） | 章程原则四 |

**依赖理由登记**（章程原则三要求）：以上每个三方包均直接对应 spec 需求，无额外依赖。

## 架构

### 总体结构

```
┌─────────────────────────────────────────────┐
│ UI 层 (app/)                                 │
│  (tabs)/index 首页 · history 历史 · train 跟练占位 · me 我的 │
│  workout/live 记录中 · workout/finish 完成页   │
│  workout/[id] 详情 · settings 设置            │
├─────────────────────────────────────────────┤
│ 状态层 (stores/)                             │
│  trackingStore: 记录中状态（时长/距离/点序列）  │
│  （设置项直接走 settingsRepo，无需单独 store）  │
├─────────────────────────────────────────────┤
│ 服务层 (services/)                           │
│  trackingEngine: 定位订阅→滤波→累计→落库       │
│  workoutRepo:    workout/track_point CRUD     │
│  settingsRepo:   设置读写                     │
├─────────────────────────────────────────────┤
│ 领域层 (domain/)  ← 纯函数，单测覆盖          │
│  geo: Haversine 距离 / 坐标转换               │
│  filter: GPS 漂移滤波                         │
│  metrics: 配速/速度/卡路里(MET)/格式化         │
│  stats: 周进度/合计/近7天活跃聚合              │
├─────────────────────────────────────────────┤
│ 原生能力                                     │
│  expo-location 后台任务 · expo-sqlite · 高德   │
└─────────────────────────────────────────────┘
```

### 关键设计：记录引擎与恢复

章程原则二（可靠性）的落地设计：

1. **开始记录** → 立即在 DB 插入 `workout(status='active')` 行，拿到 id
2. **每个轨迹点** → 滤波通过后立即 `INSERT track_point`（事务批量每 5 点 flush），同时更新内存状态
3. **暂停/继续** → 更新 workout 行的 `paused_at/accumulated_pause`
4. **App 启动时** → 检查是否存在 `status='active'` 的 workout，存在则恢复 trackingStore（从 track_point 重建距离/轨迹，时长按时间戳推算），用户回到记录页继续
5. **结束** → 事务内更新汇总字段 + `status='done'`，跳完成页

### 组件设计

#### trackingEngine（服务层，单例）
- **职责**: 管理 expo-location 订阅生命周期；接收原始点 → 调 domain/filter → 更新 trackingStore → 调 workoutRepo 落库
- **接口**: `start(type)`, `pause()`, `resume()`, `stop(): Promise<WorkoutId>`, `recover(): Promise<boolean>`
- **后台**: iOS 使用 `Location.startLocationUpdatesAsync` 后台任务（锁屏持续）；Android 前台服务通知

#### 领域纯函数（domain/，Jest 全覆盖）
- `haversineMeters(a, b)`: 球面距离
- `filterPoint(prev, next)`: 丢弃 accuracy > 30m、距离 < 3m、速度 > 15m/s 的跳点（骑行阈值放宽）
- `calcPace(distanceM, durationS)` / `calcSpeedKmh` / `calcCalories(type, weightKg, durationS)`（MET: 跑 9.8 / 骑 7.5 / 走 3.5）
- `formatDuration`, `formatPace`, `formatDistance`
- `weeklyProgress(workouts, goalKm, now)`, `summarize(workouts)`, `last7Days(workouts, now)`

#### 页面（对照原型）
- `(tabs)/index`: 原型 01（周目标环 + 今日概览 + 三类型入口）
- `workout/live`: 原型 02（高德地图 + 实时轨迹 Polyline + 底部数据面板 + 暂停/结束）
- `workout/finish`: 原型 03（总结卡 + 轨迹快照 + 配速曲线）
- `(tabs)/history`: 原型 04（筛选 chips + 记录列表，历史作为独立 Tab）
- `workout/[id]`: 详情（同完成页布局 + 删除按钮）
- `(tabs)/train`: 占位页（「敬请期待」，本期不做）
- `(tabs)/me`: 原型 08（累计统计 + 设置入口；近 7 天柱状图后续迭代）
- `settings`: 周目标/体重设置（modal）

### 坐标系处理

- expo-location 输出 WGS84 → 高德地图需 GCJ-02
- domain/geo 提供 `wgs84ToGcj02()`（公开算法实现），**入库统一存 GCJ-02**，距离计算与地图展示共用，避免双重转换
- 迷你轨迹缩略图：从 track_point 取点，等比缩放到 SVG viewBox（不做地图瓦片，纯轨迹线，与原型一致）

## 数据模型

见 [data-model.md](./data-model.md)。

## 安全与合规

- iOS: `NSLocationWhenInUseUsageDescription` + `NSLocationAlwaysAndWhenInUseUsageDescription`（中文文案），Info.plist 声明 location background mode
- Android: `ACCESS_FINE_LOCATION` + `ACCESS_BACKGROUND_LOCATION` + 前台服务类型 `location`
- 高德 Key 通过 app.json 配置，**不进 git**（`.env` + `app.config.ts` 读取）
- 无任何网络请求、无埋点（章程原则一）

## 性能策略

- 定位采样：`timeInterval: 3000` + `distanceInterval: 5` 米，双条件触发
- 轨迹点 DB 写入批量事务（每 5 点或 15 秒 flush）
- 历史列表：SQL 分页（每页 20），迷你轨迹图取抽稀点（每 N 取 1，上限 50 点）
- 记录页重渲染控制：trackingStore 按字段订阅，地图 Polyline 用 ref 增量追加

## 错误处理

| 场景 | 策略 |
|---|---|
| 定位权限拒绝 | 权限说明页 + 跳系统设置（FR-002） |
| GPS 信号丢失 | trackingStore 标记 signal='searching'，UI 展示，恢复后自动续记 |
| DB 写入失败 | 内存保留点序列，下个 flush 周期重试；连续失败提示用户 |
| 极短运动 | stop() 返回 summary，UI 判断 <50m 或 <30s 弹确认（FR-015） |

## 章程自查

- ✅ 离线优先：全功能无网络依赖
- ✅ 可靠性：增量落库 + active 恢复机制（FR-008）
- ✅ 简单：无状态机库、无额外抽象层
- ✅ 测试核心：domain/ 纯函数单测，原生部分走真机清单
- ✅ 原型即真相：页面与 design/ 01–04、08 一一对应

## 里程碑任务顺序

P1 记录主链路（engine + live + finish + 落库恢复）→ P2 历史/详情/删除 → P3 首页/我的/设置统计。详细拆解见 tasks.md。
