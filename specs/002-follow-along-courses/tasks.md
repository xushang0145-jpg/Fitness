# 实施任务：跟练课程

**Feature**: `002-follow-along-courses` | **Created**: 2026-09-02

**输入**: [spec.md](./spec.md) · [plan.md](./plan.md) · [data-model.md](./data-model.md)

---

## Phase 1: 工程地基（Foundation）

- [ ] **1.1** 基于 `main` 切出 `002-follow-along-courses` 分支
  - 确保 `001-workout-tracking` 已合并；若未合并，先阻塞等待
  - **Depends on**: 001-workout-tracking 合并 | **Requirement**: 章程分支模型

- [ ] **1.2** [P] 建立课程模块目录与静态配置
  - `assets/courses/` 或 `data/courses.ts`：4 门内置课程 + 动作数据
  - `app/course/` 页面目录、`domain/course.ts`、`services/courseRepo.ts`、`services/courseEngine.ts`、`stores/courseStore.ts`
  - **Depends on**: 1.1 | **Requirement**: plan 总体结构

- [ ] **1.3** 设计规范落为代码主题（复用现有 theme，确认颜色/字阶足够）
  - 如需新增课程分类 chip 样式，补充到 `theme/index.ts`
  - **Depends on**: 1.2 | **Requirement**: 章程原则五

---

## Phase 2: 领域核心（纯函数 + 单测）

> 每个任务 = 实现 + 对应 Jest 单测，Red-Green 顺序。

- [ ] **2.1** `domain/course.ts`：课程进度与完成度
  - `calcProgress(currentIndex, total)`、`calcCompletion(doneCount, totalCount)`、`nextActionIndex(actions, currentIndex, state)`
  - 测试：边界 0%、100%、跳过动作后的进度、越界安全
  - **Depends on**: 1.2 | **Requirement**: FR-006, FR-010, SC-006

- [ ] **2.2** `domain/course.ts`：卡路里估算
  - `calcCourseCalories(met, weightKg, durationS, completionRate)`、`calcActionCalories(met, weightKg, durationS)`
  - 测试：已知 MET × 体重 × 时长结果精确、完成度 50% 时消耗折半、0 时长安全返回
  - **Depends on**: 2.1 | **Requirement**: 澄清 Q2, FR-012

- [ ] **2.3** `domain/format.ts` 扩展：课程时长与次数格式化
  - `formatCourseDuration(s)`、`formatReps(count)`、`formatDifficulty(difficulty)`
  - 测试：秒 → mm:ss、小时 → h:mm、次数带单位
  - **Depends on**: 1.2 | **Requirement**: FR-003, FR-011

---

## Phase 3: 数据层（SQLite 迁移 + Repo）

- [ ] **3.1** `db/database.ts` 迁移到 user_version=2
  - 新增 `course_record` / `course_record_step` 两张表 + 索引
  - **Depends on**: 1.2 | **Requirement**: data-model.md

- [ ] **3.2** `services/courseRepo.ts`：课程记录 CRUD
  - `createActive(courseId, totalCount)`、`finish(recordId, summary)`、`list({offset, limit})`、`getById(id)`、`remove(id)`（级联删步骤）
  - **Depends on**: 3.1 | **Requirement**: FR-012, FR-013

- [ ] **3.3** `services/courseRepo.ts`：课程记录步骤 CRUD
  - `insertSteps(batch)`、`updateStep(recordId, orderIndex, patch)`、`getStepsByRecordId(recordId)`
  - **Depends on**: 3.2 | **Requirement**: FR-010

- [ ] **3.4** [P] `services/courseConfig.ts`：静态课程配置加载与校验
  - 读取 `assets/courses.json`（或 `data/courses.ts`），校验必填字段，过滤无效课程，内存缓存
  - **Depends on**: 1.2 | **Requirement**: FR-015, FR-016, 边界-课程数据损坏

---

## Phase 4: P1 课程主链路（用户故事 1）

- [ ] **4.1** `stores/courseStore.ts`
  - 状态：courseId、currentIndex、status（idle/running/paused）、elapsedS、completedReps、stepsState；动作：start/pause/resume/tick/increment/decrement/skipAction/completeCurrent/stop
  - **Depends on**: 2.1 | **Requirement**: FR-006, FR-007, FR-009

- [ ] **4.2** `services/courseEngine.ts`：课程执行引擎
  - `start(courseId)`、`pause()`、`resume()`、`tick()`、`increment()`、`decrement()`、`skipAction()`、`stop(): Promise<CourseRecordId>`、`finish(): Promise<CourseRecordId>`
  - 切后台自动暂停、恢复需手动继续
  - **Depends on**: 3.2, 3.3, 4.1 | **Requirement**: FR-006 ~ FR-009, 澄清 Q3

- [ ] **4.3** `app/(tabs)/train.tsx`：课程列表页（原型 05）
  - 分类 chips、课程卡片网格、今日推荐位、空态处理
  - **Depends on**: 1.3, 3.4 | **Requirement**: FR-001, FR-002

- [ ] **4.4** `app/course/[id].tsx`：课程详情页（原型 09）
  - 封面、标题、难度、预计时长、器械、动作列表、开始按钮
  - **Depends on**: 3.4, 4.3 | **Requirement**: FR-003, FR-005

- [ ] **4.5** `app/course/active.tsx`：课程执行页（原型 10）
  - 当前动作大图、进度环、计时/计数控件、暂停/跳过/结束跟练、下一动作预览
  - **Depends on**: 4.2, 4.4 | **Requirement**: FR-006 ~ FR-009

- [ ] **4.6** `app/course/finish.tsx`：课程完成页（原型 11）
  - 完成度圆环、总时长、消耗、完成动作数、返回按钮
  - **Depends on**: 4.5 | **Requirement**: FR-011, FR-012

- [ ] **4.7** P1 真机验证清单走查
  - 从「跟练」Tab 进入 → 筛选 → 进入详情 → 开始 → 完成一门课程 → 记录出现在「我的」统计
  - **Depends on**: 4.6 | **Requirement**: SC-001 ~ SC-005

---

## Phase 5: P2 动作详情（用户故事 2）

- [ ] **5.1** `app/exercise/[id].tsx`：动作详情页
  - 大图示意图、步骤分解、呼吸提示、常见错误、开始本课程入口
  - **Depends on**: 4.4 | **Requirement**: FR-004

- [ ] **5.2** 课程详情页动作项点击跳转动作详情
  - **Depends on**: 5.1 | **Requirement**: FR-004

---

## Phase 6: P3 历史与统计打通（用户故事 3）

- [ ] **6.1** `app/course/history.tsx`：跟练历史列表页
  - 按时间倒序、摘要卡片、空态；点击进入详情
  - **Depends on**: 3.2 | **Requirement**: FR-013

- [ ] **6.2** `app/course/history/[id].tsx`：单次跟练详情页
  - 课程信息、完成度、动作明细（done / skipped / pending）
  - **Depends on**: 6.1 | **Requirement**: FR-013

- [ ] **6.3** `domain/stats.ts` 扩展：合并运动记录与跟练记录
  - 新增/修改函数接受 `(workouts, courseRecords, now)`，输出训练次数、总时长、总消耗、近 7 天活跃天；距离统计仅来自 workout
  - 测试：空数组、跨周记录不计入本周、混合记录求和正确
  - **Depends on**: 2.1, 3.2 | **Requirement**: FR-014, 澄清 Q4

- [ ] **6.4** `(tabs)/me` 与 `(tabs)/index` 统计接入跟练记录
  - 累计训练次数、总消耗、近 7 天活跃天合并展示；总距离保持仅来自运动记录
  - **Depends on**: 6.3 | **Requirement**: FR-014

---

## Phase 7: 质量门禁（合并前）

- [ ] **7.1** `npx tsc --noEmit` 零错误 + `npm test` 全绿
  - **Depends on**: 6.4 | **Requirement**: 章程质量门禁

- [ ] **7.2** 真机验证清单走查
  - 全部 P1 验收场景（1-1 ~ 1-8）+ 边界情况（切后台暂停、提前结束、计数越界、空态）
  - **Depends on**: 7.1 | **Requirement**: 全部验收场景

- [ ] **7.3** 文档收尾与合并
  - 核对 plan 与实现一致（不一致先改 plan），spec Status → Implemented，合并 `002-follow-along-courses` → `main`
  - **Depends on**: 7.2 | **Requirement**: 章程工作流

---

## 备注

- `[P]` 表示可与同阶段兄弟任务并行
- 每个 Phase 内按编号顺序执行；跨 Phase 严格遵守 Depends on
- 真机验证清单在执行时展开为逐步操作项，结果记录在任务勾选处
- 不做：自定义课程、社区课程、后台下载、视频、语音播报、音乐混合
