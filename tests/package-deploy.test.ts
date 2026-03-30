import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  buildArchiveName,
  buildCleanupPlan,
  buildPackagePlan,
  parseArgs,
} = require("../scripts/package-deploy.cjs");

describe("部署打包脚本", () => {
  it("应生成带版本和时间戳的压缩包名称", () => {
    const archiveName = buildArchiveName(
      "WorkSlate",
      "1.0.0",
      new Date(Date.UTC(2026, 2, 25, 8, 9, 10))
    );

    expect(archiveName).toBe("workslate-1.0.0-20260325-080910.tar.gz");
  });

  it("应生成 standalone 部署目录需要的复制清单", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "workslate-package-"));
    const packageDir = path.join(rootDir, ".deploy", "workslate-1.0.0");

    fs.mkdirSync(path.join(rootDir, ".next", "standalone"), { recursive: true });
    fs.mkdirSync(path.join(rootDir, ".next", "static"), { recursive: true });
    fs.mkdirSync(path.join(rootDir, "public"), { recursive: true });
    fs.mkdirSync(path.join(rootDir, "generated", "prisma"), { recursive: true });
    fs.mkdirSync(path.join(rootDir, "prisma"), { recursive: true });
    fs.writeFileSync(path.join(rootDir, ".env.example"), "DATABASE_URL=file:./dev.db\n");
    fs.writeFileSync(path.join(rootDir, "dev.db"), "");

    const plan = buildPackagePlan({
      rootDir,
      packageDir,
      includeDb: true,
      includeEnv: false,
      projectName: "workslate",
      version: "1.0.0",
      now: new Date(Date.UTC(2026, 2, 25, 8, 9, 10)),
    });

    expect(plan.archiveFileName).toBe("workslate-1.0.0-20260325-080910.tar.gz");
    expect(
      plan.copyItems.map(
        (item: { fromRelative: string; toRelative: string }) => `${item.fromRelative}->${item.toRelative}`
      )
    ).toEqual([
      ".next/standalone->.",
      ".next/static->.next/static",
      "public->public",
      "generated->generated",
      "prisma->prisma",
      ".env.example->.env.example",
      "dev.db->dev.db",
    ]);
  });

  it("未显式开启时不应把 .env 打进部署包", () => {
    expect(parseArgs([])).toEqual({
      includeDb: true,
      includeEnv: false,
      skipBuild: false,
      help: false,
    });
  });

  it("默认应清理 standalone 里意外带出的环境变量文件", () => {
    expect(buildCleanupPlan({ includeEnv: false })).toEqual([
      ".env",
      ".env.local",
      ".env.production",
      ".env.production.local",
    ]);
    expect(buildCleanupPlan({ includeEnv: true })).toEqual([]);
  });
});
