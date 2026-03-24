import { prisma as defaultPrisma } from "@/lib/prisma";
import type { PrismaClient } from "../../generated/prisma/client";

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { weekStart: monday, weekEnd: sunday };
}

function getISOWeekNumber(date: Date): { year: number; weekNumber: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { year: d.getFullYear(), weekNumber };
}

export function createWeekService(prisma: PrismaClient = defaultPrisma) {
  return {
    async getOrCreateCurrentWeek() {
      const now = new Date();
      const { year, weekNumber } = getISOWeekNumber(now);
      const { weekStart, weekEnd } = getWeekRange(now);

      let week = await prisma.week.findUnique({
        where: { year_weekNumber: { year, weekNumber } },
      });

      if (!week) {
        week = await prisma.week.create({
          data: { year, weekNumber, weekStart, weekEnd },
        });
      }

      // Auto-initialize weekly status for active members without one
      const activeMembers = await prisma.member.findMany({
        where: { isActive: true },
      });

      for (const member of activeMembers) {
        const existing = await prisma.memberWeeklyStatus.findUnique({
          where: {
            weekId_memberId: { weekId: week.id, memberId: member.id },
          },
        });
        if (!existing) {
          await prisma.memberWeeklyStatus.create({
            data: { weekId: week.id, memberId: member.id },
          });
        }
      }

      return week;
    },

    async getMemberWeeklyStatus(weekId: number, memberId: number) {
      return prisma.memberWeeklyStatus.findUnique({
        where: { weekId_memberId: { weekId, memberId } },
        include: {
          workItems: { orderBy: { sortOrder: "asc" } },
          member: true,
        },
      });
    },

    async updateMemberWeeklyStatus(
      weekId: number,
      memberId: number,
      data: {
        focus?: string | null;
        healthStatus?: string;
        completionNote?: string | null;
        reviewNote?: string | null;
      }
    ) {
      return prisma.memberWeeklyStatus.update({
        where: { weekId_memberId: { weekId, memberId } },
        data,
      });
    },
  };
}

export const weekService = createWeekService();
