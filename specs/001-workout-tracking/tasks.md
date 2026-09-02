# 实施任务：运动记录（跑步 / 骑行 / 步行）

**Feature**: `001-workout-tracking` | **Created**: 2026-09-01

**输入**: [spec.md](./spec.md) · [plan.md](./plan.md) · [data-model.md](./data-model.md)

---

## Phase 1: 工程地基（Foundation）

- [x] **1.1** 初始化 Expo 工程（TypeScript 严格模式）于仓库根目录
  - `create-expo-app`（blank-typescript 模板），配置 `tsconfig` strict
  - 建立目录：`app/ components/ stores/ services/ domain/ db/ theme/`
  - **Depends on**: 无 | **Requirement**: 章程技术约束

- [x] **1.2** [P] 安装并锁定全部依赖
  - expo-router、zustand、expo-location、expo-sqlite、react-native-svg、react-native-amap3d、jest-expo、ts-jest、@types/jest
  - **Depends on**: 1.1 | **Requirement**: plan 技术栈表

- [x] **1.3** [P] 配置 jest-expo 与测试脚本
  - `jest.config.js`（jest-expo preset + ts-jest），package.json 增加 `test`、`typecheck` 脚本
  - **Depends on**: 1.2 | **Requirement**: 章程原则四

- [x] **1.4** [P] 设计规范落为代码主题
  - `theme/index.ts`：色板/字阶/圆角/间距常量，严格对照 `design/index.html` 规范速查
  - **Depends on**: 1.1 | **Requirement**: 章程原则五

- [x] **1.5** 高德 Key 与权限声明配置
  - `app.config.ts` 读取 `.env` 的高德 iOS/Android Key（Key 不进 git）
  - iOS: `NSLocationWhenInUseUsageDescription`、`NSLocationAlwaysAndWhenInUseUsageDescription`、UIBackgroundModes=location
  - Android: `ACCESS_FINE_LOCATION`、`ACCESS_BACKGROUND_LOCATION`、前台服务 location 类型
  - **Depends on**: 1.2 | **Requirement**: plan 安全与合规

- [x] **1.6** 底部 Tab 骨架与路由
  - `(tabs)/_layout.tsx` 三 Tab（运动/跟练/我的），`workout/` 路由组占位
  - 跟练 Tab 渲染"敬请期待"占位页（对照澄清 Q3）
  - **Depends on**: 1.4 | **Requirement**: spec 澄清 Q3

- [x] **1.7** prebuild + iPhone 真机 dev client 跑通
  - `expo prebuild`，Xcode 编译 dev client 到 iPhone，验证高德地图可渲染、定位权限弹窗正常
  - **Depends on**: 1.5, 1.6 | **Requirement**: plan 构建方式

---

## Phase 2: 领域核心（纯函数 + 单测）

> 每个任务 = 实现 + 对应 Jest 单测，Red-Green 顺序。

- [x] **2.1** `domain/geo.ts`：Haversine 距离
  - `haversineMeters(a, b)`；测试：已知两点距离误差 < 0.5%、同点为 0、对跖点 ≈ 半周长
  - **Depends on**: 1.3 | **Requirement**: FR-004

- [x] **2.2** [P] `domain/geo.ts`：WGS84 → GCJ-02 坐标转换
  - `wgs84ToGcj02(lat, lng)` + 中国境外不转换判断；测试：境内已知点偏移在预期范围、境外点原样返回
  - **Depends on**: 1.3 | **Requirement**: plan 坐标系处理

- [x] **2.3** `domain/filter.ts`：GPS 漂移滤波
  - `filterPoint(prev, next, type)`：丢弃 accuracy>30m、与上点距离<3m、隐含速度超阈值（跑/走 8m/s、骑 15m/s）
  - 测试：静止漂移被滤、正常移动保留、精度差的点被滤
  - **Depends on**: 2.1 | **Requirement**: FR-003

- [x] **2.4** [P] `domain/metrics.ts`：配速/速度/卡路里
  - `calcPace(distanceM, durationS)`、`calcSpeedKmh`、`calcCalories(type, weightKg, durationS)`（MET 9.8/7.5/3.5）
  - 测试：已知输入输出精确断言、0 距离安全返回
  - **Depends on**: 1.3 | **Requirement**: FR-004, 澄清 Q4

- [x] **2.5** [P] `domain/format.ts`：展示格式化
  - `formatDuration`（mm:ss / h:mm:ss）、`formatPace`（m'ss"）、`formatDistance`（<1km 显米 / ≥1km 两位小数）
  - **Depends on**: 1.3 | **Requirement**: FR-004, FR-009

- [x] **2.6** `domain/stats.ts`：统计聚合
  - `weeklyProgress(workouts, goalKm, now)`（周一为周起点）、`summarize(workouts)`、`last7Days(workouts, now)`
  - 测试：跨周记录不计入本周、空数组安全、按类型筛选后求和
  - **Depends on**: 1.3 | **Requirement**: FR-010, FR-012, FR-014

---

## Phase 3: 数据层（SQLite）

- [x] **3.1** `db/database.ts`：连接与建表
  - 按 data-model.md 建 workout / track_point / settings 三表 + 索引 + `PRAGMA foreign_keys=ON` + user_version=1
  - **Depends on**: 1.2 | **Requirement**: data-model.md

- [x] **3.2** `services/workoutRepo.ts`：记录 CRUD
  - `createActive(type)`、`finish(id, summary)`、`list({type?, offset, limit})`、`getById(id)`、`remove(id)`（级联删点）、`getActive()`、`insertPoints(batch)`（事务）
  - **Depends on**: 3.1 | **Requirement**: FR-008, FR-010, FR-011

- [x] **3.3** [P] `services/settingsRepo.ts`：设置读写
  - `get()`（无行则插入默认行）、`update(patch)`
  - **Depends on**: 3.1 | **Requirement**: FR-013

---

## Phase 4: 记录引擎 + P1 主链路（用户故事 1）

- [x] **4.1** `stores/trackingStore.ts`
  - 状态：status（idle/active/paused）、type、startTime、durationS、distanceM、points、signal；动作：tick/pushPoint/pause/resume/reset
  - **Depends on**: 1.2 | **Requirement**: FR-004, FR-006, FR-016

- [x] **4.2** `services/trackingEngine.ts`：前台采集链路
  - start（建 active 行 + 权限检查 + watchPosition）→ 点经滤波入 store 与批量落库 → pause/resume（停表停距）→ stop（汇总写库）
  - **Depends on**: 2.3, 2.4, 3.2, 4.1 | **Requirement**: FR-002, FR-003, FR-006, FR-008

- [x] **4.3** 后台定位任务
  - `TaskManager.defineTask` + `startLocationUpdatesAsync`（iOS 后台/Android 前台服务）；后台点走同一滤波+落库管道
  - **Depends on**: 4.2 | **Requirement**: FR-007

- [x] **4.4** 启动恢复
  - App 启动时 `getActive()` 非空 → 从 track_point 重建 store（距离重算、时长按时间戳推算）→ 提示返回记录页
  - **Depends on**: 4.2 | **Requirement**: FR-008, 验收场景 1-6

- [x] **4.5** `workout/live` 记录页（原型 02）
  - 高德地图 + 实时 Polyline + 当前位置点 + 底部毛玻璃面板（时长/距离/配速或速度/千卡）+ GPS 信号 chip + 暂停/继续/结束
  - **Depends on**: 1.7, 4.2, 4.3 | **Requirement**: FR-004, FR-005, FR-006, FR-016

- [x] **4.6** `workout/finish` 完成页（原型 03）
  - 总结卡 + 轨迹快照（SVG 纯轨迹）+ 每公里配速曲线 + 保存返回；极短运动确认弹窗
  - **Depends on**: 4.5, 2.5 | **Requirement**: FR-009, FR-015

- [x] **4.7** 首页三类型入口接入
  - `(tabs)/index` 类型卡片点击 → 权限检查 → `workout/live`；周目标环与今日概览先用真实数据渲染（空态友好）
  - **Depends on**: 1.6, 2.6, 4.5 | **Requirement**: FR-001, FR-012, 边界-空态

- [x] **4.8** P1 真机验证清单走查
  - iPhone 户外实测：开始→移动→暂停→继续→锁屏 10 分钟→结束→完成页数据正确；杀 App 重开恢复
  - **Depends on**: 4.6, 4.7 | **Requirement**: SC-001, SC-002, SC-003
  - 已通过（2026-09-02 室内）：记录页标题「运动记录」、计时器每秒走字、暂停锁定不归零、继续累加、结束完成页显示真实时长、详情页返回箭头
  - 已通过（2026-09-02 真机）：高德地图在记录页与详情页正常渲染（New Arch 下 bridge=nil 崩溃已用 patch-package 修复；Xcode 26 链接器需 `-Wl,-no_fixup_chains`）
  - 已通过（2026-09-02 户外）：GPS 移动 + 锁屏后台 + 杀 App 恢复实测通过

---

## Phase 5: P2 历史与详情（用户故事 2）

- [x] **5.1** `workout/history` 历史页（原型 04）
  - 类型筛选 chips + 顶部合计统计（随筛选联动）+ 分页列表（每页 20，迷你轨迹 SVG 抽稀 50 点）
  - **Depends on**: 3.2, 2.6 | **Requirement**: FR-010, SC-005

- [x] **5.2** `workout/[id]` 详情页
  - 完整数据 + 轨迹地图 + 配速曲线 + 删除（二次确认，级联删点后返回）
  - **Depends on**: 5.1 | **Requirement**: FR-011

- [x] **5.3** 空态与边界走查
  - 无记录时空态引导；100 条记录滚动/筛选性能自查
  - **Depends on**: 5.2 | **Requirement**: 边界-空态, SC-005

---

## Phase 6: P3 统计与设置（用户故事 3）

- [x] **6.1** `(tabs)/me` 我的页（原型 08）
  - 累计总里程/次数/千卡 + 近 7 天活跃柱状图（SVG）+ 设置入口
  - **Depends on**: 2.6, 3.2 | **Requirement**: FR-014

- [x] **6.2** 设置页
  - 周目标公里数、体重修改，持久化；首页进度环联动
  - **Depends on**: 3.3, 6.1 | **Requirement**: FR-013

- [x] **6.3** 首页统计接入真实数据收尾
  - 周进度环、今日步数（步行/跑步按 0.75m 步长换算）、今日消耗；验收场景 3-1/3-3 走查
  - **Depends on**: 4.7, 6.2 | **Requirement**: FR-012

---

## Phase 7: 质量门禁（合并前）

- [x] **7.1** `npx tsc --noEmit` 零错误 + `npm test` 全绿
  - **Depends on**: 6.3 | **Requirement**: 章程质量门禁

- [x] **7.2** 全量真机验证清单
  - iPhone 走完 spec 全部验收场景（1-1~1-6, 2-1~2-4, 3-1~3-3）+ 边界情况（权限拒绝/信号丢失/极短运动/空态）
  - **Depends on**: 7.1 | **Requirement**: 全部验收场景
  - 环境备忘：Bundle ID `com.shangxu.fitapp`；高德 Key `415031b082fe87a5b71683972c57135b`（已绑定该 Bundle ID）；iPhone "xushane" UDID `626D1FFA-DF4D-503B-B18F-02789F9BF803`；曾因 CoreDevice 缓存导致 xcodebuild 找不到设备，接上 USB 后若复现可重启 Mac 或在 Xcode 里 ⌘R；Xcode 26.6，iOS workspace 已 prebuild 生成
  - 已通过（2026-09-02 户外）：户外 GPS 移动、锁屏后台、杀 App 恢复等关键场景实测通过

- [x] **7.3** 文档收尾与合并
  - 核对 plan 与实现一致（不一致先改 plan），spec Status → Done，合并 `001-workout-tracking` → main
  - **Depends on**: 7.2 | **Requirement**: 章程工作流
  - 已完成（2026-09-02）：tasks.md 勾选状态更新、spec Status → Done、代码推送至 GitHub main

---

## 备注

- `[P]` 表示可与同阶段兄弟任务并行
- 每个 Phase 内按编号顺序执行；跨 Phase 严格遵守 Depends on
- 真机验证清单在执行时展开为逐步操作项，结果记录在任务勾选处
- 不做：部署、账号、云同步、跟练功能（属于后续特性）
