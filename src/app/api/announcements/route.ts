import { NextRequest } from "next/server";
import { announcementService } from "@/services/announcement-service";
import { createAnnouncementSchema } from "@/lib/validations";
import { success, error, list } from "@/lib/response";

export async function GET() {
  const announcements = await announcementService.findAll();
  return list(announcements, announcements.length);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createAnnouncementSchema.safeParse(body);

  if (!parsed.success) {
    return error(400, parsed.error.issues[0].message);
  }

  try {
    const announcement = await announcementService.create(parsed.data);
    return success(announcement, "发布成功");
  } catch {
    return error(400, "发布者不存在");
  }
}
