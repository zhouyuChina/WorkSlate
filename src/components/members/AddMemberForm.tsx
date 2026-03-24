"use client";

import { useState } from "react";

interface AddMemberFormProps {
  onAdded: () => void;
}

export default function AddMemberForm({ onAdded }: AddMemberFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    setLoading(true);
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), role: role.trim() }),
    });
    setName("");
    setRole("");
    setLoading(false);
    onAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="姓名"
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
      />
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="角色"
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        添加
      </button>
    </form>
  );
}
