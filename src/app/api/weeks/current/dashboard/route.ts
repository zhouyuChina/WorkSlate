import { weekService } from "@/services/week-service";
import { memberService } from "@/services/member-service";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/response";
import type { Member, WeeklyStatusWithItems } from "@/types";

export async function GET() {
  const week = await weekService.getOrCreateCurrentWeek();
  const members = (await memberService.findAll()) as Member[];

  const memberStats = await Promise.all(
    members.map(async (member) => {
      const status = (await weekService.getMemberWeeklyStatus(
        week.id,
        member.id
      )) as WeeklyStatusWithItems | null;
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
      memberWeeklyStatus: { weekId: week.id },
      OR: [
        { blocker: { not: "" } },
        { memberWeeklyStatus: { healthStatus: "blocked" } },
      ],
    },
  });

  return success({
    week: {
      id: week.id,
      year: week.year,
      weekNumber: week.weekNumber,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
    },
    stats: {
      memberCount: members.length,
      totalTasks,
      doneTasks: totalDone,
      completionRate:
        totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
      riskTasks,
    },
    members: memberStats,
  });
}
