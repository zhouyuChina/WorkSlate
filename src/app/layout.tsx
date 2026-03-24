import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkSlate - 周会总结与复盘系统",
  description: "团队周会管理工具，支持成员工作进展管理、团队汇总、团队公告",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
