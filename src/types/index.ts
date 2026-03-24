export interface Member {
  id: number;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkItemData {
  id: number;
  title: string;
  content: string | null;
  status: string;
  progress: number;
  blocker: string | null;
  review: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyStatusWithItems {
  id: number;
  weekId: number;
  memberId: number;
  focus: string | null;
  healthStatus: string;
  completionNote: string | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  workItems: WorkItemData[];
  member: Member;
}

export interface Announcement {
  id: number;
  memberId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  member: { id: number; name: string };
}
