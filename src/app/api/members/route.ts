import { NextRequest } from "next/server";
import { memberService } from "@/services/member-service";
import { weekService } from "@/services/week-service";
import { createMemberSchema } from "@/lib/validations";
import { success, error, list } from "@/lib/response";

export async function GET() {
  const members = await memberService.findAll();
  return list(members, members.length);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createMemberSchema.safeParse(body);

  if (!parsed.success) {
    return error(400, parsed.error.issues[0].message);
  }

  const member = await memberService.create(parsed.data);

  // Auto-initialize weekly status for new member
  const week = await weekService.getOrCreateCurrentWeek();
  const { prisma } = await import("@/lib/prisma");
  const existing = await prisma.memberWeeklyStatus.findUnique({
    where: { weekId_memberId: { weekId: week.id, memberId: member.id } },
  });
  if (!existing) {
    await prisma.memberWeeklyStatus.create({
      data: { weekId: week.id, memberId: member.id },
    });
  }

  return success(member, "创建成功");
}
