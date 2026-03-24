-- CreateTable
CREATE TABLE "members" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "weeks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "member_weekly_status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekId" INTEGER NOT NULL,
    "memberId" INTEGER NOT NULL,
    "focus" TEXT,
    "healthStatus" TEXT NOT NULL DEFAULT 'on_track',
    "completionNote" TEXT,
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "member_weekly_status_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "member_weekly_status_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memberWeeklyStatusId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "blocker" TEXT,
    "review" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_items_memberWeeklyStatusId_fkey" FOREIGN KEY ("memberWeeklyStatusId") REFERENCES "member_weekly_status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memberId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "announcements_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "weeks_year_weekNumber_key" ON "weeks"("year", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "member_weekly_status_weekId_memberId_key" ON "member_weekly_status"("weekId", "memberId");
