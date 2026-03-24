"use client";

interface MemberData {
  id: number;
  name: string;
  role: string;
  weeklyStatus: {
    focus: string | null;
    healthStatus: string;
  } | null;
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
}

interface MemberListProps {
  members: MemberData[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-yellow-100 text-yellow-800",
  blocked: "bg-red-100 text-red-800",
  done: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  on_track: "正常",
  at_risk: "有风险",
  blocked: "阻塞",
  done: "已完成",
};

export default function MemberList({ members, selectedId, onSelect, onRefresh }: MemberListProps) {
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除成员「${name}」吗？`)) return;
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-2">
      {members.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">暂无成员</p>
      )}
      {members.map((m) => {
        const hs = m.weeklyStatus?.healthStatus || "on_track";
        return (
          <div
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`p-3 rounded-lg cursor-pointer transition ${
              selectedId === m.id
                ? "bg-blue-50 border-2 border-blue-400"
                : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{m.name}</span>
                <span className="ml-2 text-xs text-gray-500">{m.role}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[hs]}`}>
                {statusLabels[hs]}
              </span>
            </div>
            {m.weeklyStatus?.focus && (
              <p className="text-xs text-gray-500 mt-1 truncate">{m.weeklyStatus.focus}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {m.doneTasks}/{m.totalTasks} 任务 · {m.completionRate}%
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(m.id, m.name); }}
                className="text-xs text-red-400 hover:text-red-600"
              >
                删除
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
