import { NextRequest } from "next/server";
import { weekService } from "@/services/week-service";
import { updateWeeklyStatusSchema } from "@/lib/validations";
import { success, error } from "@/lib/response";

type Params = { params: Promise<{ weekId: string; memberId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { weekId, memberId } = await params;
  const wId = parseInt(weekId, 10);
  const mId = parseInt(memberId, 10);
  if (isNaN(wId)) return error(400, "无效的周 ID");
  if (isNaN(mId)) return error(400, "无效的成员 ID");

  const week = await weekService.getWeekById(wId);
  if (!week) return error(404, "周记录不存在");

  const status = await weekService.getMemberWeeklyStatus(wId, mId);
  if (!status) return error(404, "该成员本周状态不存在");

  return success(status);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { weekId, memberId } = await params;
  const wId = parseInt(weekId, 10);
  const mId = parseInt(memberId, 10);
  if (isNaN(wId)) return error(400, "无效的周 ID");
  if (isNaN(mId)) return error(400, "无效的成员 ID");

  const body = await request.json();
  const parsed = updateWeeklyStatusSchema.safeParse(body);
  if (!parsed.success) {
    return error(400, parsed.error.issues[0].message);
  }

  try {
    const updated = await weekService.updateMemberWeeklyStatus(wId, mId, parsed.data);
    return success(updated);
  } catch {
    return error(404, "该成员本周状态不存在");
  }
}
