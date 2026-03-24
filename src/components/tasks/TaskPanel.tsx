"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import SafeHtml from "@/components/ui/SafeHtml";

const RichEditor = dynamic(() => import("@/components/editor/RichEditor"), {
  ssr: false,
  loading: () => <div className="h-[120px] border border-gray-300 rounded-lg animate-pulse bg-gray-50" />,
});

interface TaskItem {
  id: number;
  title: string;
  content: string | null;
  status: string;
  progress: number;
  blocker: string | null;
  review: string | null;
  sortOrder: number;
}

interface MemberWeeklyStatus {
  focus: string | null;
  healthStatus: string;
  completionNote: string | null;
  reviewNote: string | null;
}

interface TaskPanelProps {
  memberId: number;
  memberName: string;
  onTasksChanged?: () => void;
}

const statusOptions = [
  { value: "todo", label: "待办" },
  { value: "doing", label: "进行中" },
  { value: "done", label: "已完成" },
];

const healthOptions = [
  { value: "on_track", label: "正常" },
  { value: "at_risk", label: "有风险" },
  { value: "blocked", label: "阻塞" },
  { value: "done", label: "已完成" },
];

export default function TaskPanel({ memberId, memberName, onTasksChanged }: TaskPanelProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [weeklyStatus, setWeeklyStatus] = useState<MemberWeeklyStatus | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weeks/current/members/${memberId}`);
      const json = await res.json();
      if (json.code === 0 && json.data) {
        setTasks(json.data.workItems || []);
        setWeeklyStatus({
          focus: json.data.focus,
          healthStatus: json.data.healthStatus,
          completionNote: json.data.completionNote,
          reviewNote: json.data.reviewNote,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdateStatus = async (field: string, value: string | null) => {
    await fetch(`/api/weeks/current/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    await fetchTasks();
  };

  const handleAddTask = async (title: string, content: string) => {
    await fetch(`/api/weeks/current/members/${memberId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: content || null }),
    });
    setShowAddForm(false);
    await fetchTasks();
    onTasksChanged?.();
  };

  const handleUpdateTask = async (taskId: number, data: Partial<TaskItem>) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingId(null);
    await fetchTasks();
    onTasksChanged?.();
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("确定要删除这个任务吗？")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    await fetchTasks();
    onTasksChanged?.();
  };

  if (loading && tasks.length === 0) {
    return <div className="text-center py-8 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{memberName} 的任务</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 添加任务
        </button>
      </div>

      {/* Weekly Status */}
      {weeklyStatus && (
        <WeeklyStatusSection
          status={weeklyStatus}
          onUpdate={handleUpdateStatus}
        />
      )}

      {/* Add Task Form */}
      {showAddForm && (
        <AddTaskForm
          onSubmit={handleAddTask}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Task List */}
      {tasks.length === 0 && !showAddForm && (
        <p className="text-gray-400 text-sm text-center py-6">暂无任务，点击「添加任务」开始</p>
      )}

      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isEditing={editingId === task.id}
          onEdit={() => setEditingId(task.id)}
          onCancelEdit={() => setEditingId(null)}
          onUpdate={(data) => handleUpdateTask(task.id, data)}
          onDelete={() => handleDeleteTask(task.id)}
        />
      ))}
    </div>
  );
}

/* ── Weekly Status Section ── */
function WeeklyStatusSection({
  status,
  onUpdate,
}: {
  status: MemberWeeklyStatus;
  onUpdate: (field: string, value: string | null) => void;
}) {
  const [focus, setFocus] = useState(status.focus || "");

  useEffect(() => {
    setFocus(status.focus || "");
  }, [status.focus]);

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 w-16 shrink-0">健康度</label>
        <select
          value={status.healthStatus}
          onChange={(e) => onUpdate("healthStatus", e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded"
        >
          {healthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex items-start gap-3">
        <label className="text-sm font-medium text-gray-600 w-16 shrink-0 mt-1">本周重点</label>
        <input
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          onBlur={() => onUpdate("focus", focus || null)}
          placeholder="描述本周工作重点..."
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
        />
      </div>
    </div>
  );
}

/* ── Add Task Form ── */
function AddTaskForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string, content: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="任务标题"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
        autoFocus
      />
      <RichEditor content={content} onChange={setContent} placeholder="任务详情（可选）" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
          取消
        </button>
        <button
          onClick={() => { if (title.trim()) onSubmit(title.trim(), content); }}
          disabled={!title.trim()}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          添加
        </button>
      </div>
    </div>
  );
}

/* ── Task Card ── */
function TaskCard({
  task,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  task: TaskItem;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: Partial<TaskItem>) => void;
  onDelete: () => void;
}) {
  const [editData, setEditData] = useState({
    title: task.title,
    content: task.content || "",
    status: task.status,
    progress: task.progress,
    blocker: task.blocker || "",
    review: task.review || "",
  });

  useEffect(() => {
    setEditData({
      title: task.title,
      content: task.content || "",
      status: task.status,
      progress: task.progress,
      blocker: task.blocker || "",
      review: task.review || "",
    });
  }, [task]);

  const statusColor: Record<string, string> = {
    todo: "bg-gray-100 text-gray-700",
    doing: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-blue-300 rounded-lg p-4 space-y-3">
        <input
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-medium"
        />
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">状态</label>
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">进度</label>
            <input
              type="number"
              min={0}
              max={100}
              value={editData.progress}
              onChange={(e) => setEditData({ ...editData, progress: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">任务内容</label>
          <RichEditor content={editData.content} onChange={(html) => setEditData({ ...editData, content: html })} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">阻塞项</label>
          <input
            value={editData.blocker}
            onChange={(e) => setEditData({ ...editData, blocker: e.target.value })}
            placeholder="有什么阻塞项？（可选）"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">复盘笔记</label>
          <RichEditor content={editData.review} onChange={(html) => setEditData({ ...editData, review: html })} />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancelEdit} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
            取消
          </button>
          <button
            onClick={() =>
              onUpdate({
                title: editData.title,
                content: editData.content || null,
                status: editData.status,
                progress: editData.progress,
                blocker: editData.blocker || null,
                review: editData.review || null,
              })
            }
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[task.status] || statusColor.todo}`}>
            {statusOptions.find((o) => o.value === task.status)?.label || task.status}
          </span>
          <span className="font-medium text-sm">{task.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{task.progress}%</span>
          <button onClick={onEdit} className="text-xs text-blue-500 hover:text-blue-700">编辑</button>
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">删除</button>
        </div>
      </div>
      {task.content && (
        <SafeHtml html={task.content} className="mt-2 text-sm text-gray-600 prose prose-sm max-w-none" />
      )}
      {task.blocker && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          阻塞: {task.blocker}
        </div>
      )}
      {task.review && (
        <div className="mt-2 border-t pt-2">
          <span className="text-xs text-gray-400">复盘:</span>
          <SafeHtml html={task.review} className="text-sm text-gray-600 prose prose-sm max-w-none" />
        </div>
      )}
    </div>
  );
}
