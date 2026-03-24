import { prisma as defaultPrisma } from "@/lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";

export function createAnnouncementService(
  prisma: PrismaClient = defaultPrisma
) {
  return {
    async findAll() {
      return prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        include: { member: { select: { id: true, name: true } } },
      });
    },

    async create(data: { memberId: number; content: string }) {
      return prisma.announcement.create({
        data,
        include: { member: { select: { id: true, name: true } } },
      });
    },

    async findById(id: number) {
      return prisma.announcement.findUnique({ where: { id } });
    },

    async deleteByOwner(id: number, requestMemberId: number) {
      const announcement = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) {
        throw new Error("公告不存在");
      }

      if (announcement.memberId !== requestMemberId) {
        throw new Error("无权删除他人的公告");
      }

      return prisma.announcement.delete({ where: { id } });
    },
  };
}

export const announcementService = createAnnouncementService();
