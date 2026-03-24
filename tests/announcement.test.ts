import { setupTestDb, getTestPrisma } from "./helpers";
import { createAnnouncementService } from "../src/services/announcement-service";
import { createMemberService } from "../src/services/member-service";

setupTestDb();

describe("Announcement 公告管理", () => {
  describe("发布公告", () => {
    it("应成功创建公告并返回发布者信息", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const announcementService = createAnnouncementService(prisma);

      const member = await memberService.create({ name: "张三", role: "前端" });
      const announcement = await announcementService.create({
        memberId: member.id,
        content: "<p>本周五团建，请大家准时参加</p>",
      });

      expect(announcement.id).toBeDefined();
      expect(announcement.content).toBe("<p>本周五团建，请大家准时参加</p>");
      expect(announcement.member.name).toBe("张三");
      expect(announcement.createdAt).toBeInstanceOf(Date);
    });

    it("不存在的成员不能发布公告", async () => {
      const announcementService = createAnnouncementService(getTestPrisma());
      await expect(
        announcementService.create({ memberId: 99999, content: "测试公告" })
      ).rejects.toThrow();
    });
  });

  describe("查询公告列表", () => {
    it("应按发布时间倒序返回公告", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const announcementService = createAnnouncementService(prisma);

      const member = await memberService.create({ name: "张三", role: "前端" });

      await announcementService.create({
        memberId: member.id,
        content: "第一条公告",
      });
      await new Promise((r) => setTimeout(r, 10));
      await announcementService.create({
        memberId: member.id,
        content: "第二条公告",
      });

      const announcements = await announcementService.findAll();

      expect(announcements).toHaveLength(2);
      expect(announcements[0].content).toBe("第二条公告");
      expect(announcements[1].content).toBe("第一条公告");
    });

    it("没有公告时应返回空数组", async () => {
      const announcementService = createAnnouncementService(getTestPrisma());
      const announcements = await announcementService.findAll();
      expect(announcements).toHaveLength(0);
    });
  });

  describe("删除公告 — 发布者校验", () => {
    it("发布者本人应成功删除自己的公告", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const announcementService = createAnnouncementService(prisma);

      const member = await memberService.create({ name: "张三", role: "前端" });
      const announcement = await announcementService.create({
        memberId: member.id,
        content: "要删除的公告",
      });

      await announcementService.deleteByOwner(announcement.id, member.id);

      const found = await announcementService.findById(announcement.id);
      expect(found).toBeNull();
    });

    it("非发布者删除他人公告应抛出'无权删除'异常", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const announcementService = createAnnouncementService(prisma);

      const member1 = await memberService.create({ name: "张三", role: "前端" });
      const member2 = await memberService.create({ name: "李四", role: "后端" });
      const announcement = await announcementService.create({
        memberId: member1.id,
        content: "张三的公告",
      });

      await expect(
        announcementService.deleteByOwner(announcement.id, member2.id)
      ).rejects.toThrow("无权删除他人的公告");

      // 验证公告未被删除
      const found = await announcementService.findById(announcement.id);
      expect(found).not.toBeNull();
    });

    it("删除不存在的公告应抛出'公告不存在'异常", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const announcementService = createAnnouncementService(prisma);

      const member = await memberService.create({ name: "张三", role: "前端" });
      await expect(
        announcementService.deleteByOwner(99999, member.id)
      ).rejects.toThrow("公告不存在");
    });
  });

  describe("公告支持富文本", () => {
    it("应正确存储和读取 HTML 内容", async () => {
      const prisma = getTestPrisma();
      const memberService = createMemberService(prisma);
      const announcementService = createAnnouncementService(prisma);

      const member = await memberService.create({ name: "张三", role: "前端" });
      const htmlContent =
        '<h2>重要通知</h2><ul><li>事项一</li><li>事项二</li></ul><p>详见 <a href="https://example.com">链接</a></p>';

      const announcement = await announcementService.create({
        memberId: member.id,
        content: htmlContent,
      });

      const found = await announcementService.findById(announcement.id);
      expect(found!.content).toBe(htmlContent);
    });
  });
});
