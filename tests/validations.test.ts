import {
  createMemberSchema,
  updateMemberSchema,
  createWorkItemSchema,
  updateWorkItemSchema,
  createAnnouncementSchema,
  updateWeeklyStatusSchema,
} from "../src/lib/validations";

describe("Zod Schema 校验", () => {
  describe("createMemberSchema", () => {
    it("合法数据应通过", () => {
      const result = createMemberSchema.safeParse({ name: "张三", role: "前端" });
      expect(result.success).toBe(true);
    });

    it("空姓名应失败", () => {
      const result = createMemberSchema.safeParse({ name: "", role: "前端" });
      expect(result.success).toBe(false);
    });

    it("缺少姓名应失败", () => {
      const result = createMemberSchema.safeParse({ role: "前端" });
      expect(result.success).toBe(false);
    });

    it("缺少角色应失败", () => {
      const result = createMemberSchema.safeParse({ name: "张三" });
      expect(result.success).toBe(false);
    });

    it("空角色应失败", () => {
      const result = createMemberSchema.safeParse({ name: "张三", role: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("updateMemberSchema", () => {
    it("只传姓名应通过", () => {
      const result = updateMemberSchema.safeParse({ name: "李四" });
      expect(result.success).toBe(true);
    });

    it("空对象应通过（所有字段可选）", () => {
      const result = updateMemberSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("空字符串姓名应失败", () => {
      const result = updateMemberSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("空字符串角色应失败", () => {
      const result = updateMemberSchema.safeParse({ role: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("createWorkItemSchema", () => {
    it("只传标题应通过", () => {
      const result = createWorkItemSchema.safeParse({ title: "完成登录" });
      expect(result.success).toBe(true);
    });

    it("完整参数应通过", () => {
      const result = createWorkItemSchema.safeParse({
        title: "登录",
        content: "<p>详情</p>",
        status: "doing",
        progress: 50,
        blocker: "依赖后端",
        review: null,
        sortOrder: 1,
      });
      expect(result.success).toBe(true);
    });

    it("空标题应失败", () => {
      const result = createWorkItemSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });

    it("缺少标题应失败", () => {
      const result = createWorkItemSchema.safeParse({ status: "todo" });
      expect(result.success).toBe(false);
    });

    it("进度超过 100 应失败", () => {
      const result = createWorkItemSchema.safeParse({
        title: "任务",
        progress: 150,
      });
      expect(result.success).toBe(false);
    });

    it("进度为负数应失败", () => {
      const result = createWorkItemSchema.safeParse({
        title: "任务",
        progress: -10,
      });
      expect(result.success).toBe(false);
    });

    it("无效状态应失败", () => {
      const result = createWorkItemSchema.safeParse({
        title: "任务",
        status: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateWorkItemSchema", () => {
    it("只更新进度应通过", () => {
      const result = updateWorkItemSchema.safeParse({ progress: 80 });
      expect(result.success).toBe(true);
    });

    it("空对象应通过（所有字段可选）", () => {
      const result = updateWorkItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("空标题应失败", () => {
      const result = updateWorkItemSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });

    it("无效状态应失败", () => {
      const result = updateWorkItemSchema.safeParse({ status: "cancelled" });
      expect(result.success).toBe(false);
    });

    it("进度超出范围应失败", () => {
      const result = updateWorkItemSchema.safeParse({ progress: 101 });
      expect(result.success).toBe(false);
    });

    it("sortOrder 非整数应失败", () => {
      const result = updateWorkItemSchema.safeParse({ sortOrder: 1.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("createAnnouncementSchema", () => {
    it("合法数据应通过", () => {
      const result = createAnnouncementSchema.safeParse({
        memberId: 1,
        content: "通知内容",
      });
      expect(result.success).toBe(true);
    });

    it("空内容应失败", () => {
      const result = createAnnouncementSchema.safeParse({
        memberId: 1,
        content: "",
      });
      expect(result.success).toBe(false);
    });

    it("缺少内容应失败", () => {
      const result = createAnnouncementSchema.safeParse({ memberId: 1 });
      expect(result.success).toBe(false);
    });

    it("无效 memberId（负数）应失败", () => {
      const result = createAnnouncementSchema.safeParse({
        memberId: -1,
        content: "通知",
      });
      expect(result.success).toBe(false);
    });

    it("无效 memberId（零）应失败", () => {
      const result = createAnnouncementSchema.safeParse({
        memberId: 0,
        content: "通知",
      });
      expect(result.success).toBe(false);
    });

    it("缺少 memberId 应失败", () => {
      const result = createAnnouncementSchema.safeParse({ content: "通知" });
      expect(result.success).toBe(false);
    });
  });

  describe("updateWeeklyStatusSchema", () => {
    it("合法状态值应通过", () => {
      const result = updateWeeklyStatusSchema.safeParse({
        healthStatus: "at_risk",
        focus: "本周重点",
      });
      expect(result.success).toBe(true);
    });

    it("所有四个状态值均应通过", () => {
      for (const status of ["on_track", "at_risk", "blocked", "done"]) {
        const result = updateWeeklyStatusSchema.safeParse({
          healthStatus: status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("无效状态值应失败", () => {
      const result = updateWeeklyStatusSchema.safeParse({
        healthStatus: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("空对象应通过（所有字段可选）", () => {
      const result = updateWeeklyStatusSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("completionNote 和 reviewNote 可为 null", () => {
      const result = updateWeeklyStatusSchema.safeParse({
        completionNote: null,
        reviewNote: null,
      });
      expect(result.success).toBe(true);
    });

    it("completionNote 和 reviewNote 可为字符串", () => {
      const result = updateWeeklyStatusSchema.safeParse({
        completionNote: "完成说明",
        reviewNote: "复盘备注",
      });
      expect(result.success).toBe(true);
    });
  });
});
