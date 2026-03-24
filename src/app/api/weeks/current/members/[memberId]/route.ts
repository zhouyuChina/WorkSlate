import { NextRequest } from "next/server";
import { weekService } from "@/services/week-service";
import { updateWeeklyStatusSchema } from "@/lib/validations";
import { success, error } from "@/lib/response";

type Params = { params: Promise<{ memberId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const id = parseInt(memberId, 10);
  if (isNaN(id)) return error(400, "无效的成员 ID");

  const week = await weekService.getOrCreateCurrentWeek();
  const status = await weekService.getMemberWeeklyStatus(week.id, id);

  if (!status) return error(404, "该成员本周状态不存在");

  return success(status);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const id = parseInt(memberId, 10);
  if (isNaN(id)) return error(400, "无效的成员 ID");

  const body = await request.json();
  const parsed = updateWeeklyStatusSchema.safeParse(body);

  if (!parsed.success) {
    return error(400, parsed.error.issues[0].message);
  }

  const week = await weekService.getOrCreateCurrentWeek();

  try {
    const updated = await weekService.updateMemberWeeklyStatus(
      week.id,
      id,
      parsed.data
    );
    return success(updated);
  } catch {
    return error(404, "该成员本周状态不存在");
  }
}
