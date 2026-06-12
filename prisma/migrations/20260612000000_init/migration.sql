PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "datagsmId" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT NOT NULL,
  "grade" INTEGER,
  "classNumber" INTEGER,
  "studentNumber" INTEGER,
  "lastLoginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_datagsmId_key" ON "User"("datagsmId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_grade_classNumber_idx" ON "User"("grade", "classNumber");

CREATE TABLE IF NOT EXISTS "Fixture" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "externalId" INTEGER NOT NULL,
  "stage" TEXT NOT NULL,
  "groupName" TEXT NOT NULL,
  "kickoff" DATETIME NOT NULL,
  "venue" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "elapsed" INTEGER,
  "homeTeamId" INTEGER NOT NULL,
  "homeName" TEXT NOT NULL,
  "homeCode" TEXT NOT NULL,
  "homeLogo" TEXT,
  "awayTeamId" INTEGER NOT NULL,
  "awayName" TEXT NOT NULL,
  "awayCode" TEXT NOT NULL,
  "awayLogo" TEXT,
  "homeScore" INTEGER,
  "awayScore" INTEGER,
  "dataMode" TEXT NOT NULL DEFAULT 'live',
  "settledAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Fixture_externalId_key" ON "Fixture"("externalId");
CREATE INDEX IF NOT EXISTS "Fixture_kickoff_idx" ON "Fixture"("kickoff");
CREATE INDEX IF NOT EXISTS "Fixture_status_idx" ON "Fixture"("status");

CREATE TABLE IF NOT EXISTS "Prediction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "fixtureId" TEXT NOT NULL,
  "homeScore" INTEGER NOT NULL,
  "awayScore" INTEGER NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "outcomeCorrect" BOOLEAN NOT NULL DEFAULT false,
  "exactScore" BOOLEAN NOT NULL DEFAULT false,
  "scoredAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Prediction_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Prediction_userId_fixtureId_key" ON "Prediction"("userId", "fixtureId");
CREATE INDEX IF NOT EXISTS "Prediction_userId_points_idx" ON "Prediction"("userId", "points");
CREATE INDEX IF NOT EXISTS "Prediction_fixtureId_idx" ON "Prediction"("fixtureId");

CREATE TABLE IF NOT EXISTS "PredictionRevision" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "fixtureId" TEXT NOT NULL,
  "homeScore" INTEGER NOT NULL,
  "awayScore" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PredictionRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PredictionRevision_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PredictionRevision_userId_fixtureId_createdAt_idx"
ON "PredictionRevision"("userId", "fixtureId", "createdAt");
