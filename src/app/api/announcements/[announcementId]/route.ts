import { NextRequest } from "next/server";
import { announcementService } from "@/services/announcement-service";
import { error, success } from "@/lib/response";

type Params = { params: Promise<{ announcementId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { announcementId } = await params;
  const id = parseInt(announcementId, 10);
  if (isNaN(id)) return error(400, "无效的公告 ID");

  const url = new URL(request.url);
  const memberIdStr = url.searchParams.get("memberId");
  if (!memberIdStr) return error(400, "缺少 memberId 参数");

  const memberId = parseInt(memberIdStr, 10);
  if (isNaN(memberId)) return error(400, "无效的 memberId");

  try {
    await announcementService.deleteByOwner(id, memberId);
    return success(null, "删除成功");
  } catch (e) {
    const message = e instanceof Error ? e.message : "删除失败";
    const status = message === "公告不存在" ? 404 : 403;
    return error(status, message);
  }
}
