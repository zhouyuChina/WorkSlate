import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const SUITE_ID = `test_${process.pid}_${Date.now()}`;
const TEST_DB_PATH = path.join(PROJECT_ROOT, "prisma", `${SUITE_ID}.db`);
const TEST_DB_URL = `file:${TEST_DB_PATH}`;
const SCHEMA_PATH = path.join(PROJECT_ROOT, "prisma", "schema.prisma");

let prisma: PrismaClient;

export function getTestPrisma(): PrismaClient {
  return prisma;
}

export function setupTestDb() {
  beforeAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    execSync(
      `npx prisma db push --force-reset --schema "${SCHEMA_PATH}"`,
      {
        env: {
          ...process.env,
          DATABASE_URL: TEST_DB_URL,
          PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
        },
        cwd: PROJECT_ROOT,
        stdio: "pipe",
      }
    );
    const adapter = new PrismaBetterSqlite3({ url: TEST_DB_URL });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(async () => {
    await prisma.workItem.deleteMany();
    await prisma.memberWeeklyStatus.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.member.deleteMany();
    await prisma.week.deleteMany();
  });
}
