"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import WeeklySummary from "@/components/dashboard/WeeklySummary";
import MemberList from "@/components/members/MemberList";
import AddMemberForm from "@/components/members/AddMemberForm";
import TaskPanel from "@/components/tasks/TaskPanel";
import AnnouncementBoard from "@/components/announcements/AnnouncementBoard";

interface DashboardData {
  week: {
    id: number;
    year: number;
    weekNumber: number;
    weekStart: string;
    weekEnd: string;
  };
  stats: {
    memberCount: number;
    totalTasks: number;
    doneTasks: number;
    completionRate: number;
    riskTasks: number;
  };
  members: Array<{
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
  }>;
}

type Tab = "tasks" | "summary" | "announcements";

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/weeks/current/dashboard");
      const json = await res.json();
      if (json.code === 0) {
        setDashboard(json.data);
        // Auto-select first member if none selected
        if (!selectedMemberId && json.data.members.length > 0) {
          setSelectedMemberId(json.data.members[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const selectedMember = dashboard?.members.find((m) => m.id === selectedMemberId);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </main>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "tasks", label: "任务清单" },
    { key: "summary", label: "本周汇总" },
    { key: "announcements", label: "团队公告" },
  ];

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">WorkSlate</h1>
        <p className="text-sm text-gray-500">周会总结与复盘系统</p>
      </header>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="px-6 py-4">
          <DashboardStats week={dashboard.week} stats={dashboard.stats} />
        </div>
      )}

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Member List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-base font-semibold mb-3">团队成员</h2>
              <AddMemberForm onAdded={fetchDashboard} />
              <div className="mt-3">
                <MemberList
                  members={dashboard?.members || []}
                  selectedId={selectedMemberId}
                  onSelect={setSelectedMemberId}
                  onRefresh={fetchDashboard}
                />
              </div>
            </div>
          </div>

          {/* Center + Right: Tabs content */}
          <div className="lg:col-span-9">
            {/* Tab Bar */}
            <div className="flex gap-1 bg-white rounded-lg shadow p-1 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-4 py-2 text-sm rounded-md transition ${
                    activeTab === tab.key
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow p-6">
              {activeTab === "tasks" && (
                selectedMember ? (
                  <TaskPanel
                    key={selectedMember.id}
                    memberId={selectedMember.id}
                    memberName={selectedMember.name}
                    onTasksChanged={fetchDashboard}
                  />
                ) : (
                  <p className="text-gray-400 text-center py-8">请先在左侧选择一个成员</p>
                )
              )}
              {activeTab === "summary" && <WeeklySummary />}
              {activeTab === "announcements" && (
                <AnnouncementBoard currentMemberId={selectedMemberId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
