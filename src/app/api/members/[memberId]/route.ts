import { NextRequest } from "next/server";
import { memberService } from "@/services/member-service";
import { updateMemberSchema } from "@/lib/validations";
import { success, error } from "@/lib/response";

type Params = { params: Promise<{ memberId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const id = parseInt(memberId, 10);
  if (isNaN(id)) return error(400, "无效的成员 ID");

  const member = await memberService.findById(id);
  if (!member) return error(404, "成员不存在");

  return success(member);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const id = parseInt(memberId, 10);
  if (isNaN(id)) return error(400, "无效的成员 ID");

  const member = await memberService.findById(id);
  if (!member) return error(404, "成员不存在");

  const body = await request.json();
  const parsed = updateMemberSchema.safeParse(body);

  if (!parsed.success) {
    return error(400, parsed.error.issues[0].message);
  }

  const updated = await memberService.update(id, parsed.data);
  return success(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { memberId } = await params;
  const id = parseInt(memberId, 10);
  if (isNaN(id)) return error(400, "无效的成员 ID");

  const member = await memberService.findById(id);
  if (!member) return error(404, "成员不存在");

  await memberService.softDelete(id);
  return success(null, "删除成功");
}
