"use client";

import { useState, useEffect } from "react";

interface WeekItem {
  id: number;
  year: number;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
}

interface WeekSelectorProps {
  currentWeekId: number;
  selectedWeekId: number;
  onWeekChange: (weekId: number) => void;
}

export default function WeekSelector({
  currentWeekId,
  selectedWeekId,
  onWeekChange,
}: WeekSelectorProps) {
  const [weeks, setWeeks] = useState<WeekItem[]>([]);

  useEffect(() => {
    fetch("/api/weeks")
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 0) {
          setWeeks(json.data?.items || []);
        }
      });
  }, []);

  if (weeks.length === 0) return null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });

  return (
    <select
      value={selectedWeekId}
      onChange={(e) => onWeekChange(Number(e.target.value))}
      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400"
    >
      {weeks.map((w) => (
        <option key={w.id} value={w.id}>
          {w.year}年第{w.weekNumber}周 ({formatDate(w.weekStart)} - {formatDate(w.weekEnd)})
          {w.id === currentWeekId ? " ← 本周" : ""}
        </option>
      ))}
    </select>
  );
}
