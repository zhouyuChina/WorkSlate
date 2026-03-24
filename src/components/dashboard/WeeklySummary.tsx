"use client";

import { useState, useEffect, useCallback } from "react";

interface SummaryItem {
  id: number;
  title: string;
  status: string;
  progress: number;
  blocker: string | null;
  memberName: string;
}

interface MemberSummary {
  memberId: number;
  name: string;
  role: string;
  totalTasks: number;
  doneTasks: number;
  completionRate: number;
}

interface SummaryData {
  doneItems: SummaryItem[];
  doingItems: SummaryItem[];
  blockedItems: SummaryItem[];
  memberSummaries: MemberSummary[];
}

export default function WeeklySummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/weeks/current/summary");
      const json = await res.json();
      if (json.code === 0) {
        setData(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">加载中...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-400">暂无数据</div>;
  }

  const statusLabel: Record<string, string> = {
    todo: "待办",
    doing: "进行中",
    done: "已完成",
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">本周汇总</h3>

      {/* Member Summary Table */}
      <div>
        <h4 className="text-sm font-medium text-gray-600 mb-2">成员概览</h4>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">成员</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">角色</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">完成</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">总数</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">完成率</th>
              </tr>
            </thead>
            <tbody>
              {data.memberSummaries.map((m) => (
                <tr key={m.memberId} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium">{m.name}</td>
                  <td className="px-4 py-2 text-gray-500">{m.role}</td>
                  <td className="px-4 py-2 text-center text-green-600">{m.doneTasks}</td>
                  <td className="px-4 py-2 text-center">{m.totalTasks}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={m.completionRate >= 80 ? "text-green-600" : m.completionRate >= 50 ? "text-yellow-600" : "text-gray-600"}>
                      {m.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
              {data.memberSummaries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-400">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocked Items */}
      {data.blockedItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-600 mb-2">
            阻塞项 ({data.blockedItems.length})
          </h4>
          <div className="space-y-2">
            {data.blockedItems.map((item) => (
              <div key={item.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-gray-500">{item.memberName}</span>
                </div>
                {item.blocker && (
                  <p className="text-xs text-red-600 mt-1">{item.blocker}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress */}
      <div>
        <h4 className="text-sm font-medium text-blue-600 mb-2">
          进行中 ({data.doingItems.length})
        </h4>
        {data.doingItems.length === 0 ? (
          <p className="text-xs text-gray-400">无</p>
        ) : (
          <div className="space-y-1">
            {data.doingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
                <span className="text-sm">{item.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{item.memberName}</span>
                  <span className="text-xs text-blue-600">{item.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Done Items */}
      <div>
        <h4 className="text-sm font-medium text-green-600 mb-2">
          已完成 ({data.doneItems.length})
        </h4>
        {data.doneItems.length === 0 ? (
          <p className="text-xs text-gray-400">无</p>
        ) : (
          <div className="space-y-1">
            {data.doneItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-green-50 rounded px-3 py-2">
                <span className="text-sm">{item.title}</span>
                <span className="text-xs text-gray-500">{item.memberName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={fetchSummary}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
      >
        刷新汇总
      </button>
    </div>
  );
}
