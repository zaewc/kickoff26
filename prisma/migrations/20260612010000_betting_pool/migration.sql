ALTER TABLE "User" ADD COLUMN "pointBalance" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "Prediction" ADD COLUMN "wagerPoints" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "PredictionRevision" ADD COLUMN "wagerPoints" INTEGER NOT NULL DEFAULT 100;

CREATE TABLE IF NOT EXISTS "PointTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "fixtureId" TEXT,
  "predictionId" TEXT,
  "type" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PointTransaction_userId_createdAt_idx"
ON "PointTransaction"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PointTransaction_fixtureId_idx"
ON "PointTransaction"("fixtureId");
CREATE INDEX IF NOT EXISTS "PointTransaction_predictionId_idx"
ON "PointTransaction"("predictionId");
