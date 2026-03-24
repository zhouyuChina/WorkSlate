"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import WeekSelector from "@/components/dashboard/WeekSelector";
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

type Tab = "tasks" | "summary";

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [currentWeekId, setCurrentWeekId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [loading, setLoading] = useState(true);

  const isCurrentWeek = selectedWeekId === currentWeekId;

  const fetchDashboard = useCallback(async (weekId?: number | null) => {
    try {
      const url =
        weekId && weekId !== currentWeekId
          ? `/api/weeks/${weekId}/dashboard`
          : "/api/weeks/current/dashboard";
      const res = await fetch(url);
      const json = await res.json();
      if (json.code === 0) {
        setDashboard(json.data);
        // On first load, record the current week id
        if (currentWeekId === null) {
          setCurrentWeekId(json.data.week.id);
          setSelectedWeekId(json.data.week.id);
        }
        // Auto-select first member if none selected
        if (!selectedMemberId && json.data.members.length > 0) {
          setSelectedMemberId(json.data.members[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentWeekId, selectedMemberId]);

  // Initial load
  useEffect(() => {
    fetchDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when selected week changes
  const handleWeekChange = useCallback((weekId: number) => {
    setSelectedWeekId(weekId);
    setLoading(true);
    fetchDashboard(weekId);
  }, [fetchDashboard]);

  const handleRefresh = useCallback(() => {
    fetchDashboard(selectedWeekId);
  }, [fetchDashboard, selectedWeekId]);

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
    { key: "summary", label: "周汇总" },
  ];

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">WorkSlate</h1>
            <p className="text-sm text-gray-500">周会总结与复盘系统</p>
          </div>
          {currentWeekId && selectedWeekId && (
            <WeekSelector
              currentWeekId={currentWeekId}
              selectedWeekId={selectedWeekId}
              onWeekChange={handleWeekChange}
            />
          )}
        </div>
        {!isCurrentWeek && (
          <div className="mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            正在查看历史周记录
          </div>
        )}
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
          {/* Left: Announcements + Member List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <AnnouncementBoard currentMemberId={selectedMemberId} />
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-base font-semibold mb-3">团队成员</h2>
              {isCurrentWeek && <AddMemberForm onAdded={handleRefresh} />}
              <div className="mt-3">
                <MemberList
                  members={dashboard?.members || []}
                  selectedId={selectedMemberId}
                  onSelect={setSelectedMemberId}
                  onRefresh={handleRefresh}
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
                    key={`${selectedWeekId}-${selectedMember.id}`}
                    memberId={selectedMember.id}
                    memberName={selectedMember.name}
                    weekId={selectedWeekId ?? undefined}
                    isCurrentWeek={isCurrentWeek}
                    onTasksChanged={handleRefresh}
                  />
                ) : (
                  <p className="text-gray-400 text-center py-8">请先在左侧选择一个成员</p>
                )
              )}
              {activeTab === "summary" && (
                <WeeklySummary weekId={selectedWeekId ?? undefined} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
