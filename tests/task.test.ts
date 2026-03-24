import { setupTestDb, getTestPrisma } from "./helpers";
import { createTaskService } from "../src/services/task-service";
import { createMemberService } from "../src/services/member-service";
import { createWeekService } from "../src/services/week-service";

setupTestDb();

async function createTestContext() {
  const prisma = getTestPrisma();
  const memberService = createMemberService(prisma);
  const weekService = createWeekService(prisma);
  const taskService = createTaskService(prisma);

  const member = await memberService.create({ name: "张三", role: "前端" });
  const week = await weekService.getOrCreateCurrentWeek();
  const status = await prisma.memberWeeklyStatus.findUnique({
    where: { weekId_memberId: { weekId: week.id, memberId: member.id } },
  });

  return { prisma, member, week, status: status!, taskService };
}

describe("WorkItem 任务管理", () => {
  describe("创建任务", () => {
    it("应成功创建任务并设置默认值", async () => {
      const { status, taskService } = await createTestContext();

      const task = await taskService.create(status.id, {
        title: "实现登录页面",
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe("实现登录页面");
      expect(task.status).toBe("todo");
      expect(task.progress).toBe(0);
      expect(task.content).toBeNull();
      expect(task.blocker).toBeNull();
      expect(task.review).toBeNull();
      expect(task.sortOrder).toBe(0);
    });

    it("应支持富文本内容（HTML 字符串）", async () => {
      const { status, taskService } = await createTestContext();

      const htmlContent =
        "<h1>登录模块</h1><p>使用 <strong>JWT</strong> 鉴权</p>";
      const task = await taskService.create(status.id, {
        title: "登录模块",
        content: htmlContent,
      });

      expect(task.content).toBe(htmlContent);
    });
  });

  describe("更新任务", () => {
    it("应成功更新任务状态和进度", async () => {
      const { status, taskService } = await createTestContext();
      const task = await taskService.create(status.id, { title: "登录页面" });

      const updated = await taskService.update(task.id, {
        status: "doing",
        progress: 50,
      });

      expect(updated.status).toBe("doing");
      expect(updated.progress).toBe(50);
    });

    it("应成功更新任务复盘备注（富文本）", async () => {
      const { status, taskService } = await createTestContext();
      const task = await taskService.create(status.id, { title: "登录页面" });

      const reviewHtml = "<p>本周顺利完成，<em>无阻塞</em></p>";
      const updated = await taskService.update(task.id, {
        review: reviewHtml,
        status: "done",
        progress: 100,
      });

      expect(updated.review).toBe(reviewHtml);
      expect(updated.status).toBe("done");
    });

    it("更新不存在的任务应抛出异常", async () => {
      const { taskService } = await createTestContext();
      await expect(
        taskService.update(99999, { title: "不存在" })
      ).rejects.toThrow();
    });
  });

  describe("删除任务", () => {
    it("应成功删除任务", async () => {
      const { status, taskService } = await createTestContext();
      const task = await taskService.create(status.id, { title: "登录页面" });

      await taskService.delete(task.id);

      const found = await taskService.findById(task.id);
      expect(found).toBeNull();
    });
  });

  describe("查询任务列表", () => {
    it("应按 sortOrder 升序返回任务", async () => {
      const { status, taskService } = await createTestContext();
      await taskService.create(status.id, { title: "任务C", sortOrder: 3 });
      await taskService.create(status.id, { title: "任务A", sortOrder: 1 });
      await taskService.create(status.id, { title: "任务B", sortOrder: 2 });

      const tasks = await taskService.findByWeeklyStatus(status.id);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].title).toBe("任务A");
      expect(tasks[1].title).toBe("任务B");
      expect(tasks[2].title).toBe("任务C");
    });
  });
});
