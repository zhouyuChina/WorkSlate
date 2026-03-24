import { setupTestDb, getTestPrisma } from "./helpers";
import { createMemberService } from "../src/services/member-service";

setupTestDb();

describe("Member CRUD", () => {
  // --- 创建成员 ---
  describe("创建成员", () => {
    it("应成功创建成员并返回完整信息", async () => {
      const service = createMemberService(getTestPrisma());
      const member = await service.create({ name: "张三", role: "前端开发" });

      expect(member.id).toBeDefined();
      expect(member.name).toBe("张三");
      expect(member.role).toBe("前端开发");
      expect(member.isActive).toBe(true);
      expect(member.createdAt).toBeInstanceOf(Date);
      expect(member.updatedAt).toBeInstanceOf(Date);
    });
  });

  // --- 查询成员列表 ---
  describe("查询成员列表", () => {
    it("应返回所有活跃成员，按创建时间升序", async () => {
      const prisma = getTestPrisma();
      const service = createMemberService(prisma);
      await service.create({ name: "张三", role: "前端" });
      await service.create({ name: "李四", role: "后端" });
      // 直接创建一个 inactive 成员
      await prisma.member.create({
        data: { name: "王五", role: "测试", isActive: false },
      });

      const activeMembers = await service.findAll();

      expect(activeMembers).toHaveLength(2);
      expect(activeMembers[0].name).toBe("张三");
      expect(activeMembers[1].name).toBe("李四");
    });

    it("当没有活跃成员时应返回空数组", async () => {
      const service = createMemberService(getTestPrisma());
      const members = await service.findAll();
      expect(members).toHaveLength(0);
    });
  });

  // --- 更新成员 ---
  describe("更新成员", () => {
    it("应成功更新成员姓名", async () => {
      const service = createMemberService(getTestPrisma());
      const member = await service.create({ name: "张三", role: "前端" });

      const updated = await service.update(member.id, { name: "张三丰" });

      expect(updated.name).toBe("张三丰");
      expect(updated.role).toBe("前端");
    });

    it("应成功更新成员角色", async () => {
      const service = createMemberService(getTestPrisma());
      const member = await service.create({ name: "张三", role: "前端" });

      const updated = await service.update(member.id, { role: "全栈" });

      expect(updated.role).toBe("全栈");
    });

    it("更新不存在的成员应抛出异常", async () => {
      const service = createMemberService(getTestPrisma());
      await expect(
        service.update(99999, { name: "不存在" })
      ).rejects.toThrow();
    });
  });

  // --- 软删除成员 ---
  describe("软删除成员", () => {
    it("软删除应将 isActive 设为 false", async () => {
      const service = createMemberService(getTestPrisma());
      const member = await service.create({ name: "张三", role: "前端" });

      const deleted = await service.softDelete(member.id);

      expect(deleted.isActive).toBe(false);
    });

    it("软删除后不应出现在活跃成员列表中", async () => {
      const service = createMemberService(getTestPrisma());
      const member = await service.create({ name: "张三", role: "前端" });

      await service.softDelete(member.id);
      const activeMembers = await service.findAll();

      expect(activeMembers).toHaveLength(0);
    });

    it("软删除后数据仍然存在于数据库中（通过 findById 可查到）", async () => {
      const service = createMemberService(getTestPrisma());
      const member = await service.create({ name: "张三", role: "前端" });

      await service.softDelete(member.id);
      const found = await service.findById(member.id);

      expect(found).not.toBeNull();
      expect(found!.isActive).toBe(false);
    });
  });
});
