#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatTimestamp(date = new Date()) {
  return [
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`,
  ].join("-");
}

function normalizeProjectName(projectName) {
  return String(projectName || "app")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "app";
}

function buildArchiveName(projectName, version, now = new Date()) {
  const safeProjectName = normalizeProjectName(projectName);
  const safeVersion = String(version || "0.0.0").trim() || "0.0.0";
  return `${safeProjectName}-${safeVersion}-${formatTimestamp(now)}.tar.gz`;
}

function parseArgs(argv) {
  const options = {
    includeDb: true,
    includeEnv: false,
    skipBuild: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--no-db") {
      options.includeDb = false;
      continue;
    }

    if (arg === "--include-env") {
      options.includeEnv = true;
      continue;
    }

    if (arg === "--skip-build") {
      options.skipBuild = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`未知参数: ${arg}`);
  }

  return options;
}

function ensureExists(rootDir, relativePath, required, copyItems, packageDir) {
  const sourcePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(sourcePath)) {
    if (required) {
      throw new Error(`缺少必需产物: ${relativePath}`);
    }
    return;
  }

  const toRelative = relativePath === ".next/standalone" ? "." : relativePath;
  copyItems.push({
    from: sourcePath,
    to: toRelative === "." ? packageDir : path.join(packageDir, toRelative),
    fromRelative: relativePath,
    toRelative,
  });
}

function buildPackagePlan({
  rootDir,
  packageDir,
  includeDb = true,
  includeEnv = false,
  projectName = "app",
  version = "0.0.0",
  now = new Date(),
}) {
  const archiveFileName = buildArchiveName(projectName, version, now);
  const copyItems = [];

  ensureExists(rootDir, ".next/standalone", true, copyItems, packageDir);
  ensureExists(rootDir, ".next/static", true, copyItems, packageDir);
  ensureExists(rootDir, "public", false, copyItems, packageDir);
  ensureExists(rootDir, "generated", false, copyItems, packageDir);
  ensureExists(rootDir, "prisma", false, copyItems, packageDir);
  ensureExists(rootDir, ".env.example", false, copyItems, packageDir);

  if (includeDb) {
    ensureExists(rootDir, "dev.db", false, copyItems, packageDir);
    ensureExists(rootDir, "dev.db-journal", false, copyItems, packageDir);
  }

  if (includeEnv) {
    ensureExists(rootDir, ".env", false, copyItems, packageDir);
  }

  return {
    archiveFileName,
    archiveDirName: archiveFileName.replace(/\.tar\.gz$/, ""),
    copyItems,
  };
}

function buildCleanupPlan({ includeEnv = false } = {}) {
  if (includeEnv) {
    return [];
  }

  return [
    ".env",
    ".env.local",
    ".env.production",
    ".env.production.local",
  ];
}

function getExecutable(binary) {
  return process.platform === "win32" ? `${binary}.cmd` : binary;
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`命令执行失败: ${command} ${args.join(" ")}`);
  }
}

function copyItem(item) {
  const parentDir = path.dirname(item.to);
  fs.mkdirSync(parentDir, { recursive: true });
  fs.cpSync(item.from, item.to, { recursive: true });
}

function writeDeployGuide(packageDir, options) {
  const lines = [
    "# WorkSlate Deployment",
    "",
    "1. 复制 `.env.example` 为 `.env`，按实际环境修改 `DATABASE_URL`。",
    options.includeDb
      ? "2. 当前压缩包已包含 `dev.db`，默认可直接启动。"
      : "2. 当前压缩包未包含数据库文件，请自行放置 `dev.db` 或配置其他 `DATABASE_URL`。",
    options.includeEnv
      ? "3. 压缩包已包含当前 `.env`。如需替换环境，请直接修改该文件。"
      : "3. 出于安全考虑，压缩包默认不会带上 `.env`。",
    "4. 启动命令：`HOSTNAME=0.0.0.0 PORT=3000 node server.js`",
  ];

  fs.writeFileSync(path.join(packageDir, "DEPLOY.md"), `${lines.join("\n")}\n`);
}

function cleanupPackageDir(packageDir, options) {
  for (const relativePath of buildCleanupPlan(options)) {
    fs.rmSync(path.join(packageDir, relativePath), {
      recursive: true,
      force: true,
    });
  }
}

function packageProject(rawOptions = {}) {
  const options = {
    includeDb: rawOptions.includeDb !== false,
    includeEnv: rawOptions.includeEnv === true,
    skipBuild: rawOptions.skipBuild === true,
  };

  const rootDir = path.resolve(__dirname, "..");
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const deployRoot = path.join(rootDir, ".deploy");

  if (!options.skipBuild) {
    runCommand(getExecutable("npx"), ["prisma", "generate"], rootDir);
    runCommand(getExecutable("npm"), ["run", "build"], rootDir);
  }

  const initialPlan = buildPackagePlan({
    rootDir,
    packageDir: path.join(deployRoot, "placeholder"),
    includeDb: options.includeDb,
    includeEnv: options.includeEnv,
    projectName: packageJson.name,
    version: packageJson.version,
  });
  const packageDir = path.join(deployRoot, initialPlan.archiveDirName);
  const archivePath = path.join(deployRoot, initialPlan.archiveFileName);

  fs.mkdirSync(deployRoot, { recursive: true });
  fs.rmSync(packageDir, { recursive: true, force: true });
  fs.rmSync(archivePath, { force: true });

  const plan = buildPackagePlan({
    rootDir,
    packageDir,
    includeDb: options.includeDb,
    includeEnv: options.includeEnv,
    projectName: packageJson.name,
    version: packageJson.version,
  });

  for (const item of plan.copyItems) {
    copyItem(item);
  }

  cleanupPackageDir(packageDir, options);
  writeDeployGuide(packageDir, options);

  runCommand("tar", ["-czf", archivePath, "-C", deployRoot, plan.archiveDirName], rootDir);

  console.log(`部署目录: ${packageDir}`);
  console.log(`压缩包: ${archivePath}`);
  console.log("启动命令: HOSTNAME=0.0.0.0 PORT=3000 node server.js");
}

function printHelp() {
  console.log("用法: node scripts/package-deploy.cjs [--no-db] [--include-env] [--skip-build]");
  console.log("--no-db        不把当前 SQLite 数据库一起打包");
  console.log("--include-env  把当前 .env 一起打包（默认关闭，避免误带敏感信息）");
  console.log("--skip-build   跳过 prisma generate 和 next build，直接复用当前构建产物");
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      process.exit(0);
    }
    packageProject(options);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

module.exports = {
  buildArchiveName,
  buildCleanupPlan,
  buildPackagePlan,
  formatTimestamp,
  normalizeProjectName,
  packageProject,
  parseArgs,
};
