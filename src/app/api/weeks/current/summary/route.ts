import { weekService } from "@/services/week-service";
import { prisma } from "@/lib/prisma";
import { success } from "@/lib/response";

export async function GET() {
  const week = await weekService.getOrCreateCurrentWeek();

  const allItems = await prisma.workItem.findMany({
    where: { memberWeeklyStatus: { weekId: week.id } },
    include: {
      memberWeeklyStatus: {
        include: { member: { select: { id: true, name: true, role: true } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const doneItems = allItems.filter((i) => i.status === "done");
  const doingItems = allItems.filter((i) => i.status === "doing");
  const blockedItems = allItems.filter(
    (i) =>
      (i.blocker && i.blocker.length > 0) ||
      i.memberWeeklyStatus.healthStatus === "blocked"
  );

  // Per-member summary
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

  return success({
    doneItems: doneItems.map(formatItem),
    doingItems: doingItems.map(formatItem),
    blockedItems: blockedItems.map(formatItem),
    memberSummaries,
  });
}

function formatItem(item: {
  id: number;
  title: string;
  status: string;
  progress: number;
  blocker: string | null;
  memberWeeklyStatus: {
    member: { id: number; name: string };
  };
}) {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    progress: item.progress,
    blocker: item.blocker,
    memberName: item.memberWeeklyStatus.member.name,
  };
}
