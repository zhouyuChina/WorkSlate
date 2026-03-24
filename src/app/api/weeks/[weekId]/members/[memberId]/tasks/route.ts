import { NextRequest } from "next/server";
import { weekService } from "@/services/week-service";
import { taskService } from "@/services/task-service";
import { createWorkItemSchema } from "@/lib/validations";
import { success, error, list } from "@/lib/response";

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

  const tasks = await taskService.findByWeeklyStatus(status.id);
  return list(tasks, tasks.length);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { weekId, memberId } = await params;
  const wId = parseInt(weekId, 10);
  const mId = parseInt(memberId, 10);
  if (isNaN(wId)) return error(400, "无效的周 ID");
  if (isNaN(mId)) return error(400, "无效的成员 ID");

  const body = await request.json();
  const parsed = createWorkItemSchema.safeParse(body);
  if (!parsed.success) {
    return error(400, parsed.error.issues[0].message);
  }

  const week = await weekService.getWeekById(wId);
  if (!week) return error(404, "周记录不存在");

  const status = await weekService.getMemberWeeklyStatus(wId, mId);
  if (!status) return error(404, "该成员本周状态不存在");

  const task = await taskService.create(status.id, parsed.data);
  return success(task, "创建成功");
}
