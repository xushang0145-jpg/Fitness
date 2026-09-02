# 实施任务：运动数据导出（GPX / CSV）

**Feature**: `003-data-export` | **Created**: 2026-09-02

**输入**: [spec.md](./spec.md) · [plan.md](./plan.md) · 原型: `design/09-data-export.html`

---

## Phase 1: 领域层扩展（纯函数 + 单测）

> 每个任务 = 实现 + 对应 Jest 单测，Red-Green 顺序。

- [x] **1.1** `domain/geo.ts`：新增 GCJ-02 → WGS-84 反向转换
  - `gcj02ToWgs84(lat, lng)`；测试：中国境内已知点 roundtrip 误差 < 1m，境外点原样返回
  - **Depends on**: 无 | **Requirement**: FR-004, SC-002

- [x] **1.2** `domain/gpx.ts`：GPX 字符串生成
  - `buildGpx(workouts, pointsMap)`；测试：输出通过 XML 解析、空记录安全、坐标为 WGS-84
  - **Depends on**: 1.1 | **Requirement**: FR-002, FR-003

- [x] **1.3** `domain/csv.ts`：CSV 字符串生成
  - `buildCsv(rows)`；测试：BOM 头存在、中文字符不乱码、空数组仅表头、数值精度正确
  - **Depends on**: 无 | **Requirement**: FR-005, FR-006

---

## Phase 2: 数据层与服务层

- [x] **2.1** `services/workoutRepo.ts`：扩展只读查询
  - `listAllDone()`（status='done'，按 startTime DESC）、`getPoints(workoutId)`（按 timestamp ASC）
  - **Depends on**: 无 | **Requirement**: spec 关键实体

- [x] **2.2** `services/exportService.ts`：导出编排
  - `exportGpx()` / `exportCsv()`：查询 → 格式化 → 写 cache 文件 → `Sharing.shareAsync` → 清理
  - 暴露 `{ status, error, exportGpx, exportCsv }`
  - **Depends on**: 1.2, 1.3, 2.1 | **Requirement**: FR-007, FR-008, FR-010

---

## Phase 3: UI 与导航

- [x] **3.1** `app/settings/index.tsx`：设置列表页
  - 从原设置 modal 升级为 Stack 入口（或保留 modal 内 push），包含：周目标、体重、数据导出入口
  - **Depends on**: 无 | **Requirement**: FR-001

- [x] **3.2** `app/settings/export.tsx`：数据导出页
  - 顶部说明卡片、GPX 导出卡片、CSV 导出卡片、生成中 spinner、错误提示
  - 严格对照 `design/09-data-export.html`
  - **Depends on**: 3.1, 2.2 | **Requirement**: FR-009, 用户故事 1~3

- [x] **3.3** `(tabs)/me` 我的页入口调整
  - 「设置与目标」点击后进入 `app/settings/index.tsx`
  - **Depends on**: 3.1 | **Requirement**: FR-001

---

## Phase 4: 质量门禁与真机验证

- [x] **4.1** `npx tsc --noEmit` 零错误 + `npm test` 全绿
  - **Depends on**: 1.1, 1.2, 1.3 | **Requirement**: SC-005

- [ ] **4.2** 真机验证清单
  - 生成 GPX → 分享到 Files → 用 Keep / Strava / 高德导入，轨迹可识别（SC-001）
  - 生成 CSV → 用 Excel / Numbers 打开，中文无乱码、数值正确（SC-003）
  - 无记录时导出，文件格式仍合法
  - 取消分享不崩溃
  - 100 条记录导出耗时 < 2s（SC-004）
  - **Depends on**: 3.2, 4.1 | **Requirement**: SC-001, SC-003, SC-004, SC-006

- [ ] **4.3** 文档收尾与合并
  - 更新 `spec.md` Status → Done，`plan.md` Status → Final，`tasks.md` 勾选状态
  - 合并 `003-data-export` → `main`
  - **Depends on**: 4.2 | **Requirement**: 章程工作流

---

## 备注

- 本特性为只读导出，禁止修改 `workout` / `track_point` 表结构或写入逻辑。
- `[P]` 表示可与同阶段兄弟任务并行；本任务清单暂无非并行标注，按依赖顺序执行。
- 真机验证清单在执行时展开为逐步操作项，结果记录在任务勾选处。
