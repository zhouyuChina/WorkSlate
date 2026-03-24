import { setupTestDb, getTestPrisma } from "./helpers";
import { createWeekService } from "../src/services/week-service";
import { createMemberService } from "../src/services/member-service";

setupTestDb();

describe("Week 周管理", () => {
  describe("创建周记录", () => {
    it("应成功创建周记录", async () => {
      const prisma = getTestPrisma();
      const week = await prisma.week.create({
        data: {
          year: 2026,
          weekNumber: 13,
          weekStart: new Date("2026-03-23"),
          weekEnd: new Date("2026-03-29"),
        },
      });

      expect(week.id).toBeDefined();
      expect(week.year).toBe(2026);
      expect(week.weekNumber).toBe(13);
    });

    it("同年同周不能重复创建（唯一约束）", async () => {
      const prisma = getTestPrisma();
      await prisma.week.create({
        data: {
          year: 2026,
          weekNumber: 13,
          weekStart: new Date("2026-03-23"),
          weekEnd: new Date("2026-03-29"),
        },
      });

      await expect(
        prisma.week.create({
          data: {
            year: 2026,
            weekNumber: 13,
            weekStart: new Date("2026-03-23"),
            weekEnd: new Date("2026-03-29"),
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("getOrCreateCurrentWeek 自动初始化", () => {
    it("调用 getOrCreateCurrentWeek 应自动为活跃成员创建周状态", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const weekService = createWeekService(prisma);

      // 先创建两个活跃成员和一个非活跃成员
      const m1 = await memberService.create({ name: "张三", role: "前端" });
      const m2 = await memberService.create({ name: "李四", role: "后端" });
      const m3 = await memberService.create({ name: "王五", role: "测试" });
      await memberService.softDelete(m3.id);

      // 调用业务入口
      const week = await weekService.getOrCreateCurrentWeek();

      // 验证：活跃成员自动生成了周状态
      const s1 = await prisma.memberWeeklyStatus.findUnique({
        where: { weekId_memberId: { weekId: week.id, memberId: m1.id } },
      });
      const s2 = await prisma.memberWeeklyStatus.findUnique({
        where: { weekId_memberId: { weekId: week.id, memberId: m2.id } },
      });
      const s3 = await prisma.memberWeeklyStatus.findUnique({
        where: { weekId_memberId: { weekId: week.id, memberId: m3.id } },
      });

      expect(s1).not.toBeNull();
      expect(s1!.healthStatus).toBe("on_track");
      expect(s2).not.toBeNull();
      expect(s3).toBeNull(); // 非活跃成员不初始化
    });

    it("重复调用 getOrCreateCurrentWeek 不应重复创建周记录或状态", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const weekService = createWeekService(prisma);

      await memberService.create({ name: "张三", role: "前端" });

      const week1 = await weekService.getOrCreateCurrentWeek();
      const week2 = await weekService.getOrCreateCurrentWeek();

      expect(week1.id).toBe(week2.id);

      const statuses = await prisma.memberWeeklyStatus.findMany({
        where: { weekId: week1.id },
      });
      expect(statuses).toHaveLength(1); // 不重复
    });
  });

  describe("更新成员周状态", () => {
    it("应成功更新本周重点和工作状态", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const weekService = createWeekService(prisma);

      const member = await memberService.create({ name: "张三", role: "前端" });
      const week = await weekService.getOrCreateCurrentWeek();

      const updated = await weekService.updateMemberWeeklyStatus(
        week.id,
        member.id,
        {
          focus: "完成登录模块",
          healthStatus: "at_risk",
          completionNote: "进度延迟",
        }
      );

      expect(updated.focus).toBe("完成登录模块");
      expect(updated.healthStatus).toBe("at_risk");
      expect(updated.completionNote).toBe("进度延迟");
    });
  });
});
