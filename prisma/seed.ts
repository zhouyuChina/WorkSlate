import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function seed() {
  // 获取现有成员
  const members = await prisma.member.findMany({ where: { isActive: true } });
  if (members.length === 0) {
    console.log("没有活跃成员，请先通过界面添加成员");
    process.exit(1);
  }

  // 创建过去 3 周的历史数据
  const historicalWeeks = [
    { year: 2026, weekNumber: 10, weekStart: new Date("2026-03-02"), weekEnd: new Date("2026-03-08") },
    { year: 2026, weekNumber: 11, weekStart: new Date("2026-03-09"), weekEnd: new Date("2026-03-15") },
    { year: 2026, weekNumber: 12, weekStart: new Date("2026-03-16"), weekEnd: new Date("2026-03-22") },
  ];

  const taskTemplates = [
    // 第 10 周
    [
      { title: "项目初始化与技术选型", status: "done", progress: 100, content: "<p>确定 Next.js + Prisma 技术栈</p>" },
      { title: "数据库设计与建模", status: "done", progress: 100, content: "<p>完成 5 张核心表设计</p>" },
      { title: "搭建 CI/CD 流程", status: "done", progress: 100, blocker: null },
    ],
    // 第 11 周
    [
      { title: "实现成员管理 API", status: "done", progress: 100, content: "<p>CRUD + 软删除</p>" },
      { title: "实现任务管理 API", status: "done", progress: 100 },
      { title: "编写单元测试", status: "doing", progress: 70, blocker: "Jest ESM 配置问题" },
      { title: "接入富文本编辑器", status: "todo", progress: 0 },
    ],
    // 第 12 周
    [
      { title: "修复 Prisma 7 ESM 兼容问题", status: "done", progress: 100 },
      { title: "完成 Tiptap 富文本集成", status: "done", progress: 100, content: "<p>支持加粗、斜体、链接、代码块</p>" },
      { title: "实现前端仪表盘页面", status: "doing", progress: 80, content: "<p>统计卡片 + 成员列表</p>" },
      { title: "响应式布局适配", status: "doing", progress: 40, blocker: "移动端样式待调整" },
      { title: "公告功能开发", status: "todo", progress: 0 },
    ],
  ];

  const healthStatuses = ["on_track", "on_track", "at_risk"];
  const focuses = [
    "项目基础架构搭建",
    "后端核心 API 开发",
    "前端页面开发与集成",
  ];

  for (let i = 0; i < historicalWeeks.length; i++) {
    const weekData = historicalWeeks[i];

    // 检查是否已存在
    const existing = await prisma.week.findUnique({
      where: { year_weekNumber: { year: weekData.year, weekNumber: weekData.weekNumber } },
    });
    if (existing) {
      console.log(`第 ${weekData.weekNumber} 周已存在，跳过`);
      continue;
    }

    const week = await prisma.week.create({ data: weekData });
    console.log(`创建第 ${week.weekNumber} 周`);

    // 为每个成员创建周状态和任务
    for (let j = 0; j < members.length; j++) {
      const member = members[j];
      const status = await prisma.memberWeeklyStatus.create({
        data: {
          weekId: week.id,
          memberId: member.id,
          focus: focuses[i],
          healthStatus: j === 0 ? healthStatuses[i] : "on_track",
          completionNote: i < 2 ? "按计划完成" : null,
        },
      });

      // 给第一个成员分配完整任务，第二个成员分配部分任务
      const tasks = j === 0 ? taskTemplates[i] : taskTemplates[i].slice(0, 2);
      for (let k = 0; k < tasks.length; k++) {
        const t = tasks[k];
        await prisma.workItem.create({
          data: {
            memberWeeklyStatusId: status.id,
            title: t.title,
            content: t.content || null,
            status: t.status,
            progress: t.progress,
            blocker: t.blocker || null,
            sortOrder: k,
          },
        });
      }
    }
    console.log(`  → 已为 ${members.length} 个成员创建任务`);
  }

  console.log("\n历史数据 seed 完成！刷新页面后可通过右上角周选择器切换查看。");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
