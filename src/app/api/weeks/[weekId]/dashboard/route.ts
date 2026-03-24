import { NextRequest } from "next/server";
import { weekService } from "@/services/week-service";
import { success, error } from "@/lib/response";

type Params = { params: Promise<{ weekId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { weekId } = await params;
  const id = parseInt(weekId, 10);
  if (isNaN(id)) return error(400, "无效的周 ID");

  const data = await weekService.getDashboardData(id);
  if (!data) return error(404, "周记录不存在");

  return success(data);
}
