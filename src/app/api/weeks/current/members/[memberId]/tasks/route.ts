import { NextRequest } from "next/server";
import { weekService } from "@/services/week-service";
import { taskService } from "@/services/task-service";
import { createWorkItemSchema } from "@/lib/validations";
import { success, error, list } from "@/lib/response";

type Params = { params: Promise<{ memberId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const id = parseInt(memberId, 10);
  if (isNaN(id)) return error(400, "无效的成员 ID");

  const week = await weekService.getOrCreateCurrentWeek();
  const status = await weekService.getMemberWeeklyStatus(week.id, id);

  if (!status) return error(404, "该成员本周状态不存在");

  const tasks = await taskService.findByWeeklyStatus(status.id);
  return list(tasks, tasks.length);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const id = parseInt(memberId, 10);
  if (isNaN(id)) return error(400, "无效的成员 ID");

  const body = await request.json();
  const parsed = createWorkItemSchema.safeParse(body);

  if (!parsed.success) {
    return error(400, parsed.error.issues[0].message);
  }

  const week = await weekService.getOrCreateCurrentWeek();
  const status = await weekService.getMemberWeeklyStatus(week.id, id);

  if (!status) return error(404, "该成员本周状态不存在");

  const task = await taskService.create(status.id, parsed.data);
  return success(task, "创建成功");
}
