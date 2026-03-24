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

    async listWeeks() {
      return prisma.week.findMany({
        orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
      });
    },

    async getWeekById(id: number) {
      return prisma.week.findUnique({ where: { id } });
    },

    async getDashboardData(weekId: number) {
      const week = await prisma.week.findUnique({ where: { id: weekId } });
      if (!week) return null;

      const activeMembers = await prisma.member.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });

      const memberStats = await Promise.all(
        activeMembers.map(async (member) => {
          const status = await prisma.memberWeeklyStatus.findUnique({
            where: { weekId_memberId: { weekId, memberId: member.id } },
            include: { workItems: { orderBy: { sortOrder: "asc" } } },
          });
          const totalTasks = status?.workItems.length ?? 0;
          const doneTasks =
            status?.workItems.filter((w) => w.status === "done").length ?? 0;

          return {
            ...member,
            weeklyStatus: status
              ? {
                  id: status.id,
                  focus: status.focus,
                  healthStatus: status.healthStatus,
                  completionNote: status.completionNote,
                  reviewNote: status.reviewNote,
                }
              : null,
            totalTasks,
            doneTasks,
            completionRate:
              totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
          };
        })
      );

      const totalTasks = memberStats.reduce((sum, m) => sum + m.totalTasks, 0);
      const totalDone = memberStats.reduce((sum, m) => sum + m.doneTasks, 0);
      const riskTasks = await prisma.workItem.count({
        where: {
          memberWeeklyStatus: { weekId },
          OR: [
            { blocker: { not: "" } },
            { memberWeeklyStatus: { healthStatus: "blocked" } },
          ],
        },
      });

      return {
        week: {
          id: week.id,
          year: week.year,
          weekNumber: week.weekNumber,
          weekStart: week.weekStart,
          weekEnd: week.weekEnd,
        },
        stats: {
          memberCount: activeMembers.length,
          totalTasks,
          doneTasks: totalDone,
          completionRate:
            totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
          riskTasks,
        },
        members: memberStats,
      };
    },

    async getSummaryData(weekId: number) {
      const allItems = await prisma.workItem.findMany({
        where: { memberWeeklyStatus: { weekId } },
        include: {
          memberWeeklyStatus: {
            include: { member: { select: { id: true, name: true, role: true } } },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      const formatItem = (item: typeof allItems[number]) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        progress: item.progress,
        blocker: item.blocker,
        memberName: item.memberWeeklyStatus.member.name,
      });

      const doneItems = allItems.filter((i) => i.status === "done");
      const doingItems = allItems.filter((i) => i.status === "doing");
      const blockedItems = allItems.filter(
        (i) =>
          (i.blocker && i.blocker.length > 0) ||
          i.memberWeeklyStatus.healthStatus === "blocked"
      );

      const memberMap = new Map<
        number,
        { name: string; role: string; items: typeof allItems }
      >();
      for (const item of allItems) {
        const m = item.memberWeeklyStatus.member;
        if (!memberMap.has(m.id)) {
          memberMap.set(m.id, { name: m.name, role: m.role, items: [] });
        }
        memberMap.get(m.id)!.items.push(item);
      }

      const memberSummaries = Array.from(memberMap.entries()).map(
        ([memberId, { name, role, items }]) => {
          const done = items.filter((i) => i.status === "done").length;
          const total = items.length;
          return {
            memberId,
            name,
            role,
            totalTasks: total,
            doneTasks: done,
            completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
          };
        }
      );

      return {
        doneItems: doneItems.map(formatItem),
        doingItems: doingItems.map(formatItem),
        blockedItems: blockedItems.map(formatItem),
        memberSummaries,
      };
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
