import { weekService } from "@/services/week-service";
import { success } from "@/lib/response";

export async function GET() {
  const week = await weekService.getOrCreateCurrentWeek();
  const data = await weekService.getDashboardData(week.id);
  return success(data);
}
