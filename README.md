# WorkSlate

团队周会总结与复盘系统。以周为单位管理团队成员工作进展，支持任务管理、团队汇总、公告发布和历史周回顾。

## 功能

- **仪表盘** — 当前周统计概览（成员数、任务总数、完成率、风险任务）
- **成员管理** — 添加/删除团队成员，查看每人工作状态
- **任务管理** — 每个成员的工作任务 CRUD，支持状态、进度、阻塞项、复盘笔记
- **富文本编辑** — 任务内容和复盘笔记支持富文本（Tiptap）
- **团队汇总** — 按状态分组查看所有任务（已完成/进行中/阻塞）
- **团队公告** — 发布和查看团队公告，支持富文本
- **历史周切换** — 通过周选择器查看往期周的完整记录

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| ORM | Prisma 7 |
| 数据库 | SQLite |
| 富文本 | Tiptap 3 |
| 校验 | Zod 4 |
| 测试 | Jest |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 初始化数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

浏览器打开 http://localhost:3000

### 插入测试数据（可选）

先通过界面添加至少一个成员，然后运行：

```bash
npx tsx prisma/seed.ts
```

会生成 3 周的历史任务数据，用于体验周选择器功能。

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── members/        # 成员 CRUD
│   │   ├── weeks/          # 周数据（current + [weekId]）
│   │   ├── tasks/          # 任务更新/删除
│   │   └── announcements/  # 公告 CRUD
│   ├── layout.tsx
│   └── page.tsx            # 主页面
├── components/
│   ├── dashboard/          # 统计卡片、周选择器、周汇总
│   ├── members/            # 成员列表、添加表单
│   ├── tasks/              # 任务面板
│   ├── announcements/      # 公告板
│   ├── editor/             # Tiptap 富文本编辑器
│   └── ui/                 # 通用组件（SafeHtml）
├── services/               # 业务逻辑层
├── lib/                    # Prisma 实例、响应工具、Zod schemas
└── types/                  # TypeScript 类型定义
prisma/
├── schema.prisma           # 数据模型
├── migrations/             # 迁移文件
└── seed.ts                 # 测试数据脚本
tests/                      # Jest 测试
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/members` | 成员列表 |
| POST | `/api/members` | 创建成员 |
| GET | `/api/members/:id` | 成员详情 |
| PUT | `/api/members/:id` | 更新成员 |
| DELETE | `/api/members/:id` | 删除成员（软删除） |
| GET | `/api/weeks` | 所有周列表 |
| GET | `/api/weeks/current/dashboard` | 当前周仪表盘 |
| GET | `/api/weeks/current/summary` | 当前周汇总 |
| GET | `/api/weeks/:weekId/dashboard` | 指定周仪表盘 |
| GET | `/api/weeks/:weekId/summary` | 指定周汇总 |
| GET/PUT | `/api/weeks/:weekId/members/:memberId` | 成员周状态 |
| GET/POST | `/api/weeks/:weekId/members/:memberId/tasks` | 成员任务 |
| PUT/DELETE | `/api/tasks/:id` | 更新/删除任务 |
| GET | `/api/announcements` | 公告列表 |
| POST | `/api/announcements` | 发布公告 |
| DELETE | `/api/announcements/:id?memberId=` | 删除公告 |

统一响应格式：`{ code: 0, message: "success", data: ... }`

## 数据模型

- **Member** — 成员（软删除）
- **Week** — 周记录（year + weekNumber 唯一）
- **MemberWeeklyStatus** — 成员周状态（健康度、本周重点）
- **WorkItem** — 工作任务（状态、进度、阻塞项、复盘）
- **Announcement** — 团队公告

## 测试

```bash
npm test
```

## 构建

```bash
npm run build
npm start
```

## 部署打包

```bash
npm run package:deploy
```

执行后会：

- 先运行 `npx prisma generate` 和 `npm run build`
- 基于 Next.js standalone 输出生成可部署目录
- 自动复制 `.next/static`、`public`、`generated`、`prisma`
- 默认把当前 `dev.db` 一起打进包，产物输出到 `.deploy/`
- 额外生成一个 `.tar.gz` 压缩包，方便直接上传服务器
- ⚠️ 项目依赖 `better-sqlite3`（原生模块），打包建议在目标服务器相同的 OS/CPU 架构上执行，否则可能出现二进制不兼容

常用参数：

```bash
# 不把本地 SQLite 数据一起打包
npm run package:deploy -- --no-db

# 明确需要时再把当前 .env 带进去
npm run package:deploy -- --include-env

# 已经构建过时，直接复用现有产物
npm run package:deploy -- --skip-build
```

部署后进入解压目录，启动命令：

```bash
HOSTNAME=0.0.0.0 PORT=3000 node server.js
```

## License

MIT
