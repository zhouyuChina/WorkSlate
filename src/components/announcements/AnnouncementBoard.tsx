"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const RichEditor = dynamic(() => import("@/components/editor/RichEditor"), {
  ssr: false,
  loading: () => <div className="h-[120px] border border-gray-300 rounded-lg animate-pulse bg-gray-50" />,
});

interface AnnouncementItem {
  id: number;
  memberId: number;
  content: string;
  createdAt: string;
  member: { id: number; name: string };
}

interface AnnouncementBoardProps {
  currentMemberId: number | null;
}

export default function AnnouncementBoard({ currentMemberId }: AnnouncementBoardProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch("/api/announcements");
    const json = await res.json();
    if (json.code === 0) {
      setAnnouncements(json.data || []);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSubmit = async () => {
    if (!content.trim() || !currentMemberId) return;
    setSubmitting(true);
    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: currentMemberId, content }),
      });
      setContent("");
      setShowForm(false);
      await fetchAnnouncements();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!currentMemberId || !confirm("确定要删除这条公告吗？")) return;
    await fetch(`/api/announcements/${id}?memberId=${currentMemberId}`, {
      method: "DELETE",
    });
    await fetchAnnouncements();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">团队公告</h3>
        {currentMemberId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? "取消" : "+ 发布公告"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
          <RichEditor content={content} onChange={setContent} placeholder="输入公告内容..." />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              发布
            </button>
          </div>
        </div>
      )}

      {announcements.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-6">暂无公告</p>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{a.member.name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(a.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
              {currentMemberId === a.memberId && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  删除
                </button>
              )}
            </div>
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: a.content }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
