import { z } from "zod";

// Member
export const createMemberSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  role: z.string().min(1, "角色不能为空"),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1, "姓名不能为空").optional(),
  role: z.string().min(1, "角色不能为空").optional(),
});

// MemberWeeklyStatus
export const updateWeeklyStatusSchema = z.object({
  focus: z.string().nullable().optional(),
  healthStatus: z
    .enum(["on_track", "at_risk", "blocked", "done"])
    .optional(),
  completionNote: z.string().nullable().optional(),
  reviewNote: z.string().nullable().optional(),
});

// WorkItem
export const createWorkItemSchema = z.object({
  title: z.string().min(1, "任务标题不能为空"),
  content: z.string().nullable().optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  blocker: z.string().nullable().optional(),
  review: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateWorkItemSchema = z.object({
  title: z.string().min(1, "任务标题不能为空").optional(),
  content: z.string().nullable().optional(),
  status: z.enum(["todo", "doing", "done"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  blocker: z.string().nullable().optional(),
  review: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

// Announcement
export const createAnnouncementSchema = z.object({
  memberId: z.number().int().positive("发布者 ID 无效"),
  content: z.string().min(1, "公告内容不能为空"),
});
