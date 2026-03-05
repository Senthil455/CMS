/*
  Warnings:

  - You are about to drop the column `modelName` on the `AiResponseLog` table. All the data in the column will be lost.
  - You are about to drop the column `providerName` on the `AiResponseLog` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiResponseLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "handler" TEXT NOT NULL,
    "modelSelection" TEXT,
    "input" TEXT,
    "response" TEXT NOT NULL,
    "schemaId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AiResponseLog" ("handler", "id", "input", "response", "schemaId", "timestamp") SELECT "handler", "id", "input", "response", "schemaId", "timestamp" FROM "AiResponseLog";
DROP TABLE "AiResponseLog";
ALTER TABLE "new_AiResponseLog" RENAME TO "AiResponseLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
