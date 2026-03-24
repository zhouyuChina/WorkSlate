import { prisma as defaultPrisma } from "@/lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";

export function createMemberService(prisma: PrismaClient = defaultPrisma) {
  return {
    async findAll() {
      return prisma.member.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    },

    async findById(id: number) {
      return prisma.member.findUnique({ where: { id } });
    },

    async create(data: { name: string; role: string }) {
      return prisma.member.create({ data });
    },

    async update(id: number, data: { name?: string; role?: string }) {
      return prisma.member.update({ where: { id }, data });
    },

    async softDelete(id: number) {
      return prisma.member.update({
        where: { id },
        data: { isActive: false },
      });
    },
  };
}

export const memberService = createMemberService();
