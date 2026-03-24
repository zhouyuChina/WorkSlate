"use client";

interface DashboardStatsProps {
  week: { weekStart: string; weekEnd: string; year: number; weekNumber: number };
  stats: { memberCount: number; totalTasks: number; doneTasks: number; completionRate: number; riskTasks: number };
}

export default function DashboardStats({ week, stats }: DashboardStatsProps) {
  const startDate = new Date(week.weekStart).toLocaleDateString("zh-CN");
  const endDate = new Date(week.weekEnd).toLocaleDateString("zh-CN");

  const cards = [
    { label: "成员数", value: stats.memberCount },
    { label: "任务总数", value: stats.totalTasks },
    { label: "已完成", value: stats.doneTasks },
    { label: "完成率", value: `${stats.completionRate}%` },
    { label: "风险任务", value: stats.riskTasks, highlight: stats.riskTasks > 0 },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700">
          {week.year} 年第 {week.weekNumber} 周
        </h2>
        <p className="text-sm text-gray-500">{startDate} - {endDate}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-lg shadow p-4 text-center ${
              card.highlight ? "border-2 border-red-400" : ""
            }`}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.highlight ? "text-red-600" : "text-gray-800"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
