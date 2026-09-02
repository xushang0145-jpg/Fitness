# 实现方案：跟练课程

**Feature Branch**: `002-follow-along-courses` | **Created**: 2026-09-02 | **Status**: Draft

**输入**: [spec.md](./spec.md) · 基准原型: `design/05-training.html` 升级 + `design/09~11` 新增 · 章程: `.specify/memory/constitution.md`

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | React Native 0.86 + Expo SDK 52，TypeScript strict | 章程技术约束 |
| 导航 | expo-router v4（文件路由，Stack + Tabs） | 章程技术约束；课程详情 / 执行 / 完成使用 Stack 页面 |
| 状态 | zustand | 轻量；课程引擎状态与 UI 解耦 |
| 存储 | expo-sqlite | 课程记录与运动记录同库，共享 stats 聚合 |
| 计时 | `setInterval` / `Date.now()` 差值 | 动作计时精度要求不高，无需重型库；切后台暂停避免误差 |
| 示意图 | 本地静态图片 / `Image` 组件 | 章程约束 MVP 不引入视频；静态图可预置在 assets |
| 图表/圆环 | react-native-svg | 完成页进度环、动作进度圆环复用现有 SVG 能力 |
| 测试 | jest-expo + ts-jest（纯逻辑单测） | 章程原则四；计时逻辑用 fake timers 测试 |

**依赖理由登记**（章程原则三要求）：以上每个选型均直接对应 spec 需求，无额外新增依赖。

## 架构

### 总体结构

```
┌─────────────────────────────────────────────┐
│ UI 层 (app/)                                 │
│  (tabs)/train        课程列表（原型 05）      │
│  course/[id]         课程详情（原型 09）    │
│  course/active       课程执行（原型 10）    │
│  course/finish       课程完成（原型 11）    │
│  exercise/[id]       动作详情（P2）          │
│  course/history      跟练历史（P3）          │
├─────────────────────────────────────────────┤
│ 状态层 (stores/)                             │
│  courseStore:        课程执行状态（当前动作、  │
│                      计时/计数、暂停、完成度）│
├─────────────────────────────────────────────┤
│ 服务层 (services/)                           │
│  courseRepo:         课程 / 动作 / 记录 CRUD  │
│  courseEngine:       动作推进、计时、完成判定  │
├─────────────────────────────────────────────┤
│ 领域层 (domain/)  ← 纯函数，Jest 覆盖        │
│  course.ts:          进度、完成度、卡路里     │
│  format.ts 扩展:     课程时长格式化            │
├─────────────────────────────────────────────┤
│ 配置层 (assets/courses.json)                 │
│  内置课程静态数据（4 门课程 + 动作列表）       │
└─────────────────────────────────────────────┘
```

### 关键设计：课程引擎与状态流转

1. **开始课程** → `courseEngine.start(courseId)`
   - 从静态配置加载 Course + CourseAction 列表
   - 在 DB 插入 `course_record(status='active')` 行，拿到 id
   - 初始化 `courseStore`：currentIndex=0, state='running'/'paused', 每个动作状态 pending
2. **动作执行** → `courseEngine.tick()` / `increment()` / `skip()`
   - `timer` 类型：用 `setInterval` 每秒更新 `elapsedS`，到目标时长自动 `completeCurrent()`
   - `counter` 类型：用户点击 +1 更新 `completedReps`，达到目标次数自动完成
   - `rest` 类型：倒计时到 0 自动进入下一动作；用户可点「跳过休息」
3. **切后台 / 锁屏** → 课程执行页 `useAppState` 监听，进入后台时自动调用 `pause()`
   - 恢复前台时展示暂停遮罩，用户点「继续」才恢复计时
   - 避免后台时间被错误计入
4. **提前结束** → `courseEngine.stop()`
   - 保存已完成的动作到 `course_record_step`
   - 计算总时长、完成度、消耗，更新 `course_record(status='done')`
   - 跳完成页
5. **全部完成** → 最后一个动作完成后自动进入完成页
6. **App 启动恢复** → 跟练不恢复进行中的课程（与运动记录不同）
   - 若有 `status='active'` 的 course_record（异常退出残留），将其状态改为 `done` 并标记完成度
   - 不主动拉起课程执行页，避免打扰用户

### 组件设计

#### courseEngine（服务层，单例）
- **职责**: 管理课程执行生命周期；维护内存状态；协调 DB 写入
- **接口**:
  - `start(courseId: string): Promise<void>`
  - `pause(): void`
  - `resume(): void`
  - `tick(): void`（timer/rest 每秒调用）
  - `increment(): void`（counter +1）
  - `decrement(): void`（counter -1，不低于 0）
  - `skipAction(): void`（跳过当前动作）
  - `stop(): Promise<CourseRecordId>`（提前结束）
  - `finish(): Promise<CourseRecordId>`（正常完成）

#### 领域纯函数（domain/course.ts，Jest 全覆盖）
- `calcProgress(currentIndex, total)`: 当前整体进度百分比
- `calcCompletion(doneCount, totalCount)`: 完成度百分比
- `calcCourseCalories(met, weightKg, durationS, completionRate)`: 课程消耗
- `formatCourseDuration(s)`: `mm:ss` 或 `h:mm:ss`
- `formatReps(count)`: `x12`
- `nextActionIndex(actions, currentIndex, state)`: 计算下一步索引

#### 页面（对照原型）
- `(tabs)/train`: 原型 05（课程列表 + 分类筛选 + 今日推荐）
- `course/[id]`: 原型 09（封面、简介、动作列表、开始按钮）
- `course/active`: 原型 10（当前动作大图、进度环、计数/计时控件、暂停/跳过）
- `course/finish`: 原型 11（完成度圆环、总时长、消耗、动作明细、返回按钮）
- `exercise/[id]`: 动作详情页（P2；课程详情页动作项点击进入）
- `course/history`: 跟练历史列表（P3）

### 数据层与迁移

- 复用 `db/database.ts`，新增 `course` / `course_action` / `course_record` / `course_record_step` 四张表
- 静态课程数据不建表：直接读取 `assets/courses.json`（或 `data/courses.ts`），避免迁移
- `course_record` 与 `course_record_step` 需要迁移，因为用户数据随时间增长
- 迁移版本从 `user_version=2` 开始（001 为 1）

## 数据模型

见 [data-model.md](./data-model.md)。

## 安全与合规

- 无任何网络请求、无埋点（章程原则一）
- 内置课程 JSON 可进 git，不含用户隐私数据
- 用户产生的 `course_record` 仅本地存储，删除账号 / 卸载 App 即清除（与运动记录一致）

## 性能策略

- 课程列表从静态 JSON 读取，启动时一次性解析并缓存到内存
- 课程详情页动作列表使用 `FlatList` 或 `ScrollView`（MVP 动作数 ≤ 10，ScrollView 可接受）
- 课程执行页每秒重绘范围控制在当前动作区域，避免整页刷新
- 完成页一次性查询 `course_record_step` 列表，上限受课程动作数约束

## 错误处理

| 场景 | 策略 |
|---|---|
| 内置课程 JSON 字段缺失 | 启动校验，缺失必填字段的课程不展示，控制台报错，不阻塞其他课程 |
| 用户切后台计时 | 自动暂停，回到前台需手动继续（FR-009 / Q3） |
| 计数动作越界 | +1 不超过目标 × 组数；-1 不低于 0 |
| DB 写入失败 | 完成页提示「保存失败，是否重试」；内存保留结果，用户可重试 |
| 课程执行中崩溃 | 下次启动将残留 `active` 记录标记为 `done`（完成度按已完成动作计算） |

## 章程自查

- ✅ 离线优先：课程静态配置、记录本地存储、执行无需网络
- ✅ 可靠性：课程记录完成时一次性落库，执行中动作完成即写入 `course_record_step`（避免丢失进度）
- ✅ 简单：不引入状态机库、不引入视频库、不抽象后台同步层
- ✅ 测试核心：`domain/course.ts` 纯函数单测，原生/UI 部分走真机清单
- ✅ 原型即真相：页面与 design/05、09、10、11 一一对应

## 里程碑任务顺序

P1 课程主链路（列表 → 详情 → 执行 → 完成 → 落库）→ P2 动作详情 → P3 历史与统计打通。详细拆解见 tasks.md。
