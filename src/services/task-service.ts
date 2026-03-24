import { prisma as defaultPrisma } from "@/lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";

export function createTaskService(prisma: PrismaClient = defaultPrisma) {
  return {
    async create(
      memberWeeklyStatusId: number,
      data: {
        title: string;
        content?: string | null;
        status?: string;
        progress?: number;
        blocker?: string | null;
        review?: string | null;
        sortOrder?: number;
      }
    ) {
      return prisma.workItem.create({
        data: { memberWeeklyStatusId, ...data },
      });
    },

    async findById(id: number) {
      return prisma.workItem.findUnique({ where: { id } });
    },

    async update(
      id: number,
      data: {
        title?: string;
        content?: string | null;
        status?: string;
        progress?: number;
        blocker?: string | null;
        review?: string | null;
        sortOrder?: number;
      }
    ) {
      return prisma.workItem.update({ where: { id }, data });
    },

    async delete(id: number) {
      return prisma.workItem.delete({ where: { id } });
    },

    async findByWeeklyStatus(memberWeeklyStatusId: number) {
      return prisma.workItem.findMany({
        where: { memberWeeklyStatusId },
        orderBy: { sortOrder: "asc" },
      });
    },
  };
}

export const taskService = createTaskService();
