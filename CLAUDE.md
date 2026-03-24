# WorkSlate — 每周开会总结与复盘系统

## 项目概述

团队周会管理工具，支持成员工作进展管理、团队汇总、团队公告、富文本编辑。详细技术方案见 `docs/technical-plan.md`。

## 技术栈

- **框架**：Next.js 16.2.1（App Router）+ React 19
- **语言**：TypeScript（前后端统一）
- **样式**：Tailwind CSS
- **ORM**：Prisma 7
- **数据库**：SQLite
- **富文本**：Tiptap 3.0（基于 ProseMirror）
- **参数校验**：Zod
- **测试**：Jest + React Testing Library
- **代码规范**：ESLint + Prettier

## 工程目录结构

```
workslate/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/              # API Routes（按资源分目录）
│   │       ├── members/
│   │       ├── weeks/
│   │       ├── tasks/
│   │       └── announcements/
│   ├── components/           # React 组件（按功能模块分组）
│   │   ├── ui/               # 通用 UI 组件
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── tasks/
│   │   ├── announcements/
│   │   └── editor/           # Tiptap 富文本编辑器封装
│   ├── lib/                  # Prisma 实例、工具函数、Zod schemas
│   ├── services/             # 业务逻辑层
│   └── types/                # TypeScript 类型定义
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 开发规范

### TDD 流程（强制）

每个新功能或接口严格遵循：

1. **Red**：先写 Jest 测试，覆盖核心链路和边缘异常
2. **确认**：测试用例需经用户确认后，才能编写实现代码
3. **Green**：编写刚好通过测试的最简实现

### 分层架构

`API Route → Service（业务逻辑）→ Prisma Client（数据访问）`

- API Route：负责请求解析、Zod 校验、调用 Service、返回响应
- Service：负责业务逻辑，不直接处理 HTTP 请求/响应
- Prisma Client：负责数据库访问，Service 层直接调用

### 命名规范

- 文件名：kebab-case（`member-service.ts`）
- React 组件：PascalCase（`MemberCard.tsx`）
- API Routes：遵循 Next.js 约定（`route.ts`）
- Prisma 模型：PascalCase 单数（`Member`、`WorkItem`、`Announcement`）
- 数据库表名：由 Prisma 自动映射（camelCase）
- 变量/函数：camelCase
- 常量/枚举值：UPPER_SNAKE_CASE 或字符串字面量

### 接口设计规范

- 统一响应格式：`{ code: 0, message: "success", data: ... }`
- 错误响应格式：`{ code: <错误码>, message: "<错误描述>", data: null }`
- 列表接口返回：`{ code: 0, message: "success", data: { items: [...], total: n } }`
- 参数校验使用 Zod schema，定义在 `src/lib/validations.ts`

### 富文本规范

- 使用 Tiptap 3.0，封装为独立组件 `src/components/editor/`
- 富文本存储格式：HTML 字符串
- 输出渲染时使用 DOMPurify 做 XSS 过滤
- 应用场景：工作内容说明、复盘备注、公告内容

### 数据模型（5 张表）

| 表名 | 说明 | 关键约束 |
|------|------|----------|
| `Member` | 成员基础信息 | `isActive` 软删除 |
| `Week` | 周维度主表 | `year + weekNumber` 唯一 |
| `MemberWeeklyStatus` | 成员周状态 | `weekId + memberId` 唯一 |
| `WorkItem` | 具体工作任务 | 关联 `MemberWeeklyStatus` |
| `Announcement` | 团队公告（全局） | 关联 `Member`，不绑定周 |

### 测试规范

- 测试文件放在 `tests/` 目录下
- API 测试命名：`<模块名>.api.test.ts`
- 组件测试命名：`<组件名>.test.tsx`
- 使用内存 SQLite 作为测试数据库
- 每个 API 至少覆盖：正常路径、参数校验失败、资源不存在

### Git 提交规范

- 提交信息格式：`<type>: <简短描述>`
- type 可选值：`feat`、`fix`、`refactor`、`test`、`docs`、`chore`
- 示例：`feat: 实现成员 CRUD 接口`、`test: 添加公告接口测试用例`

## 开发顺序

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

## 安全注意事项

- 富文本内容输出时必须经过 DOMPurify 过滤，防止 XSS
- API 接口需校验入参，使用 Zod 做运行时验证
- 删除操作需校验所属关系（如公告只能被发布者删除）
