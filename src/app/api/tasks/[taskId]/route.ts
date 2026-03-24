import { NextRequest } from "next/server";
import { taskService } from "@/services/task-service";
import { updateWorkItemSchema } from "@/lib/validations";
import { success, error } from "@/lib/response";

type Params = { params: Promise<{ taskId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const id = parseInt(taskId, 10);
  if (isNaN(id)) return error(400, "无效的任务 ID");

  const existing = await taskService.findById(id);
  if (!existing) return error(404, "任务不存在");

  const body = await request.json();
  const parsed = updateWorkItemSchema.safeParse(body);

  if (!parsed.success) {
    return error(400, parsed.error.issues[0].message);
  }

  const updated = await taskService.update(id, parsed.data);
  return success(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const id = parseInt(taskId, 10);
  if (isNaN(id)) return error(400, "无效的任务 ID");

  const existing = await taskService.findById(id);
  if (!existing) return error(404, "任务不存在");

  await taskService.delete(id);
  return success(null, "删除成功");
}
