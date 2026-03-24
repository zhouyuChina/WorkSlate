import { weekService } from "@/services/week-service";
import { list } from "@/lib/response";

export async function GET() {
  const weeks = await weekService.listWeeks();
  return list(weeks, weeks.length);
}
