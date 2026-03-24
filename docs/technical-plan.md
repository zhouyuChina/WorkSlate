# 每周开会总结与复盘系统技术方案

## 1. 项目目标

建设一个用于周会前整理、周会中汇报、周会后复盘的 Web 系统，围绕"本周成员工作进展"进行统一管理。系统核心目标如下：

- 以周为单位展示团队所有成员的工作状况和完成状况
- 支持新增、编辑、删除成员
- 支持每个成员维护自己的工作清单，并进行增删改查
- 提供团队汇总视图，集中查看本周工作内容、进行中事项和风险项
- 支持团队公告发布与查看，便于信息传达和团队协作
- 支持富文本编辑，提升内容表达能力
- 使用 Next.js 全栈架构，TypeScript 统一前后端语言

## 2. 范围定义

### 2.1 本期范围

- Web 端单页管理界面
- Next.js 全栈应用（前端 + API Routes）
- SQLite 本地数据库
- 当前周的数据管理与展示
- 成员管理
- 成员周任务管理
- 团队汇总展示
- 团队公告管理
- 富文本编辑（工作内容、复盘备注、公告内容）

### 2.2 暂不纳入本期

- 登录鉴权
- 多角色权限控制
- 消息通知
- Excel / PDF 导出
- 复杂审批流
- 多周历史回溯界面

说明：

本期会在数据库层面保留"按周扩展"的能力，但前端交互先聚焦当前周，保证第一版可快速上线和验证。

## 3. 业务场景

### 3.1 团队负责人

- 查看本周所有成员的任务总览和完成率
- 快速发现进行中任务、阻塞任务和未完成事项
- 通过汇总区形成周会汇报内容

### 3.2 团队成员

- 维护个人本周工作清单
- 使用富文本编辑器编写工作内容和复盘备注
- 更新任务状态、进度、阻塞项和复盘信息
- 在周会中快速展示个人本周完成情况
- 发布团队公告，向全团队传达重要信息
- 查看其他成员发布的公告

## 4. 总体架构

系统采用 Next.js 全栈架构：

1. 前端使用 React 组件化开发，负责页面展示与交互
2. 后端使用 Next.js API Routes / Server Actions，负责业务逻辑与数据访问
3. Prisma ORM 负责数据库建模与访问
4. SQLite 负责本地持久化存储

架构链路如下：

`Browser -> Next.js (React) -> API Routes / Server Actions -> Prisma -> SQLite`

### 4.1 架构说明

- 前端：React 组件，负责周报总览、成员列表、任务编辑、汇总视图、公告板、富文本编辑
- 后端：Next.js API Routes，负责成员 CRUD、任务 CRUD、公告 CRUD、当前周数据聚合、统计计算
- 数据库：Prisma ORM 访问 SQLite，存储成员、周维度数据、任务数据和公告数据

### 4.2 架构选择原因

- 需要富文本编辑器，React 生态有成熟方案（Tiptap），集成自然
- TypeScript 统一前后端语言，减少上下文切换和类型不一致问题
- Next.js 全栈能力避免前后端分离部署的复杂度
- Prisma 类型安全的 ORM，开发体验优于传统 SQL 拼接
- SQLite 部署简单，适合本地运行和中小团队内部工具
- 后续若需要升级为 PostgreSQL，Prisma 数据层可平滑迁移

## 5. 技术选型

### 5.1 前端

- Next.js 16.2.1（App Router）
- React 19
- TypeScript
- Tailwind CSS
- Tiptap 3.0（富文本编辑器，基于 ProseMirror）

说明：

- Next.js App Router 提供 RSC、Server Actions 等现代能力
- Tiptap 3.0 为 headless 编辑器，高度可定制，支持扩展
- Tailwind CSS 提供实用优先的样式方案，开发效率高

### 5.2 后端

- Next.js API Routes / Server Actions
- Prisma 7（ORM）
- Zod（请求参数校验）

说明：

- Prisma 提供类型安全的数据库访问，自动生成 TypeScript 类型
- Zod 用于运行时参数校验，与 TypeScript 类型系统无缝配合

### 5.3 数据库

- SQLite

说明：

- 本地部署成本低
- 非常适合当前阶段的中小规模数据量
- 无需额外数据库服务即可运行
- 通过 Prisma 访问，后续可平滑切换至 PostgreSQL

### 5.4 工程辅助

- Prisma Migrate：数据库迁移管理
- Jest + React Testing Library：测试框架
- ESLint + Prettier：代码规范

## 6. 功能设计

### 6.1 周会总览区

展示当前周的核心统计信息：

- 当前周范围
- 成员总数
- 任务总数
- 已完成任务数
- 团队整体完成率
- 风险任务数

### 6.2 成员列表区

按成员展示本周工作状态，每个成员卡片包含：

- 姓名
- 角色 / 岗位
- 本周重点
- 工作状态
- 任务总数
- 已完成数量
- 完成率
- 编辑入口
- 删除入口

### 6.3 成员任务清单区

选中成员后展示该成员本周工作清单，支持：

- 新增任务
- 编辑任务
- 删除任务
- 更新任务状态
- 更新任务进度
- 使用富文本编辑器维护工作内容说明
- 维护阻塞项
- 使用富文本编辑器维护复盘备注

### 6.4 团队汇总区

用于汇总本周整体工作内容，包含：

- 已完成事项汇总
- 进行中事项汇总
- 存在阻塞的事项
- 按成员归纳的周会汇报文本

### 6.5 成员周状态维护

除任务清单外，每位成员在当前周还需要维护如下周维度信息：

- 本周重点
- 整体工作状态
- 完成情况说明
- 周复盘备注

### 6.6 团队公告板

提供独立的公告板区域，用于团队成员之间的信息传达。公告为全局性内容，跨周可见。

- 任何成员均可发布公告
- 公告内容支持富文本编辑
- 公告列表按发布时间倒序展示
- 每条公告显示：发布者姓名、发布时间、公告内容
- 支持新增公告
- 支持删除公告（仅发布者本人可删除自己的公告）

### 6.7 富文本编辑器

使用 Tiptap 3.0 作为富文本编辑器，支持以下能力：

- 标题（H1-H3）
- 粗体、斜体、下划线、删除线
- 有序列表、无序列表
- 代码块
- 链接
- 引用块

应用场景：

- 工作内容说明（work_items.content）
- 复盘备注（work_items.review）
- 公告内容（announcements.content）

## 7. 页面结构

建议页面划分如下：

1. 顶部：系统标题、当前周信息、整体统计卡片
2. 左侧：成员列表与成员管理表单
3. 中间：当前成员的周状态与任务清单（含富文本编辑器）
4. 右侧：团队汇总与风险视图
5. 底部或独立区域：团队公告板

移动端下改为纵向堆叠：

1. 总览
2. 成员列表
3. 成员任务区
4. 团队汇总区
5. 团队公告板

## 8. 数据模型设计

使用 Prisma Schema 定义数据模型，共五张核心表。

### 8.1 `members`

成员基础信息表，存储相对稳定的信息。

字段：

- `id`：Int，主键，自增
- `name`：String，成员姓名
- `role`：String，岗位 / 角色
- `isActive`：Boolean，默认 true，是否启用
- `createdAt`：DateTime，默认当前时间
- `updatedAt`：DateTime，自动更新

说明：

删除成员时优先做软删除，即把 `isActive` 标记为 `false`，避免影响后续历史数据。

### 8.2 `weeks`

周维度主表，用于标识当前是哪一周。

字段：

- `id`：Int，主键，自增
- `year`：Int，年份
- `weekNumber`：Int，第几周
- `weekStart`：DateTime，周开始日期
- `weekEnd`：DateTime，周结束日期
- `createdAt`：DateTime，默认当前时间
- `updatedAt`：DateTime，自动更新

约束：

- `year + weekNumber` 唯一（`@@unique([year, weekNumber])`）

### 8.3 `memberWeeklyStatus`

成员在某一周的状态表，表示"某成员在某周的汇报信息"。

字段：

- `id`：Int，主键，自增
- `weekId`：Int，关联 `weeks.id`
- `memberId`：Int，关联 `members.id`
- `focus`：String?，本周重点
- `healthStatus`：String，默认 `"on_track"`，整体工作状态
- `completionNote`：String?，完成情况说明
- `reviewNote`：String?，周复盘备注
- `createdAt`：DateTime，默认当前时间
- `updatedAt`：DateTime，自动更新

healthStatus 可选值：

- `on_track`：进展正常
- `at_risk`：存在风险
- `blocked`：有明显阻塞
- `done`：本周目标已完成

约束：

- `weekId + memberId` 唯一（`@@unique([weekId, memberId])`）

### 8.4 `workItems`

成员在某一周下的具体工作任务。

字段：

- `id`：Int，主键，自增
- `memberWeeklyStatusId`：Int，关联 `memberWeeklyStatus.id`
- `title`：String，任务标题
- `content`：String?，工作内容说明（富文本，存储 HTML）
- `status`：String，默认 `"todo"`，任务状态
- `progress`：Int，默认 0，进度百分比（0-100）
- `blocker`：String?，阻塞项
- `review`：String?，复盘备注（富文本，存储 HTML）
- `sortOrder`：Int，默认 0，排序值
- `createdAt`：DateTime，默认当前时间
- `updatedAt`：DateTime，自动更新

status 可选值：

- `todo`
- `doing`
- `done`

### 8.5 `announcements`

团队公告表，存储全局性公告信息，不绑定特定周。

字段：

- `id`：Int，主键，自增
- `memberId`：Int，关联 `members.id`，发布者
- `content`：String，公告内容（富文本，存储 HTML）
- `createdAt`：DateTime，默认当前时间
- `updatedAt`：DateTime，自动更新

### 8.6 表关系

- 一个 `week` 可以关联多个 `memberWeeklyStatus`
- 一个 `member` 可以在多个 `week` 下拥有多条 `memberWeeklyStatus`
- 一个 `memberWeeklyStatus` 可以关联多个 `workItems`
- 一个 `member` 可以发布多条 `announcements`

## 9. 数据库设计示意

### 9.1 关系说明

`members (1) -> (n) memberWeeklyStatus (n) -> (1) weeks`

`memberWeeklyStatus (1) -> (n) workItems`

`members (1) -> (n) announcements`

### 9.2 设计理由

- 成员基础信息与每周数据分离，便于未来支持历史周数据
- 任务挂在"成员-周"关系之下，符合业务语义
- 团队汇总数据优先实时计算，不单独建表，避免冗余
- 富文本内容以 HTML 格式存储，前端直接渲染

说明：

"汇总工作内容"第一版建议通过查询实时聚合生成，不单独落库。如果后续确认需要人工编辑汇总文案，再追加 `teamWeeklySummary` 表。

## 10. 后端接口设计

第一版采用 RESTful 风格 API Routes，统一挂载在 `/api/` 前缀下。

### 10.1 周会总览

- `GET /api/weeks/current/dashboard`

返回内容：

- 当前周信息
- 整体统计信息
- 成员列表及各自完成情况
- 默认选中成员详情
- 团队汇总结果

### 10.2 成员管理

- `GET /api/members`
- `POST /api/members`
- `PUT /api/members/{memberId}`
- `DELETE /api/members/{memberId}`

说明：

- 删除建议做软删除
- 新增成员后，后端自动为当前周初始化一条 `memberWeeklyStatus`

### 10.3 成员周状态管理

- `GET /api/weeks/current/members/{memberId}`
- `PUT /api/weeks/current/members/{memberId}`

用于维护：

- 本周重点
- 整体工作状态
- 完成情况说明
- 周复盘备注

### 10.4 任务管理

- `POST /api/weeks/current/members/{memberId}/tasks`
- `PUT /api/tasks/{taskId}`
- `DELETE /api/tasks/{taskId}`

必要时可补充：

- `GET /api/weeks/current/members/{memberId}/tasks`

### 10.5 团队汇总

- `GET /api/weeks/current/summary`

返回内容：

- 已完成任务列表
- 进行中任务列表
- 阻塞任务列表
- 成员维度汇总文本

### 10.6 公告管理

- `GET /api/announcements`：获取公告列表（按发布时间倒序）
- `POST /api/announcements`：发布新公告
- `DELETE /api/announcements/{announcementId}`：删除公告（仅发布者本人可删除）

请求参数（POST）：

- `memberId`：发布者 ID
- `content`：公告内容（富文本 HTML）

返回内容（GET）：

- 公告 ID
- 发布者姓名
- 公告内容
- 发布时间

## 11. 核心业务规则

### 11.1 当前周初始化

系统打开时先根据当前日期定位当前周：

- 若 `weeks` 中不存在当前周记录，则自动创建
- 若某活跃成员尚未在当前周建立 `memberWeeklyStatus`，则自动初始化

### 11.2 完成率统计

- 成员完成率 = 已完成任务数 / 成员总任务数
- 团队完成率 = 全部已完成任务数 / 全部任务数

### 11.3 风险任务判定

满足以下任一条件可进入风险项统计：

- `blocker` 非空
- `healthStatus = blocked`
- 任务状态长期未完成且进度过低

第一版建议先采用前两条规则，逻辑保持明确。

### 11.4 汇总内容生成

团队汇总区由后端实时聚合生成，规则如下：

- 汇总已完成任务
- 汇总进行中任务
- 汇总存在阻塞的任务
- 按成员拼装周会口径文本

## 12. 前后端职责划分

### 12.1 前端职责

- React 组件化页面展示
- 表单交互与富文本编辑
- 调用后端 API 接口
- 展示统计卡片和汇总内容
- 展示公告板并支持发布和删除公告
- 响应式布局适配移动端

### 12.2 后端职责

- 当前周识别与初始化
- 成员与任务的增删改查
- 公告的增删查
- 完成率与风险统计
- 团队汇总生成
- Prisma 数据持久化

## 13. 推荐工程目录

建议采用如下目录结构：

```text
workslate/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/              # API Routes
│   │       ├── members/
│   │       ├── weeks/
│   │       ├── tasks/
│   │       └── announcements/
│   ├── components/           # React 组件
│   │   ├── ui/               # 通用 UI 组件
│   │   ├── dashboard/        # 总览区组件
│   │   ├── members/          # 成员相关组件
│   │   ├── tasks/            # 任务相关组件
│   │   ├── announcements/    # 公告相关组件
│   │   └── editor/           # 富文本编辑器组件
│   ├── lib/                  # 工具函数与配置
│   │   ├── prisma.ts         # Prisma Client 实例
│   │   ├── utils.ts
│   │   └── validations.ts   # Zod schemas
│   ├── services/             # 业务逻辑层
│   └── types/                # TypeScript 类型定义
├── prisma/
│   ├── schema.prisma         # 数据模型定义
│   └── migrations/           # 数据库迁移文件
├── tests/                    # 测试目录
├── public/                   # 静态资源
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

说明：

- `app/api/`：API Routes，按资源分目录
- `components/`：按功能模块分组的 React 组件
- `components/editor/`：Tiptap 富文本编辑器封装
- `services/`：业务逻辑层，API Routes 调用 service 处理业务
- `lib/`：Prisma 实例、工具函数、Zod 校验 schema

## 14. 开发顺序建议

1. 初始化 Next.js 工程（TypeScript + Tailwind CSS + ESLint）
2. 配置 Prisma + SQLite，定义数据模型，执行首次迁移
3. 实现 Prisma Client 封装与 Service 层基础结构
4. 实现成员 CRUD API Routes
5. 实现周初始化与成员周状态 API Routes
6. 实现任务 CRUD API Routes
7. 实现公告 CRUD API Routes
8. 封装 Tiptap 富文本编辑器组件
9. 实现前端页面：总览区、成员列表、任务清单、汇总区、公告板
10. 前后端联调与响应式适配
11. 完成测试与基础验收

## 15. 测试与验收建议

### 15.1 接口层

- 验证新增成员是否自动生成当前周数据
- 验证成员编辑和软删除是否生效
- 验证任务增删改查是否正确写入 SQLite
- 验证汇总接口返回是否与任务状态一致
- 验证公告的新增、查询、删除接口是否正常
- 验证删除公告时是否校验发布者身份
- 验证富文本内容（HTML）的存储与读取

### 15.2 页面层

- 验证成员列表统计是否正确
- 验证选中成员后任务区是否正确切换
- 验证修改任务状态后总览和汇总是否同步刷新
- 验证富文本编辑器的输入、保存和回显
- 验证公告板区域是否正确展示公告列表
- 验证发布公告后列表是否实时更新
- 验证移动端展示是否可用

## 16. 风险与评审重点

以下几个点建议在开发前先确认：

1. 第一版是否只管理"当前周"，还是需要提前支持历史周切换
2. 删除成员是否必须保留历史数据
3. 汇总区是否只做自动生成，还是需要允许人工编辑
4. 是否需要区分"成员本人编辑"和"管理员代编辑"
5. 富文本内容是否需要做 XSS 过滤（建议需要）

当前推荐方案：

- 第一版只做当前周界面
- 删除成员采用软删除
- 汇总区先做自动生成
- 第一版不做权限系统
- 富文本输出时做 XSS 过滤（使用 DOMPurify 或类似方案）

## 17. 当前结论

本方案采用 Next.js 全栈架构：

- Next.js 16.2.1（App Router）+ React 19 + TypeScript
- Prisma 7 + SQLite 数据持久化
- Tiptap 3.0 富文本编辑器
- Tailwind CSS 样式方案
- Jest + React Testing Library 测试
- 统一 TypeScript 语言，前后端类型共享

在你评审通过前，先不进入开发阶段。
