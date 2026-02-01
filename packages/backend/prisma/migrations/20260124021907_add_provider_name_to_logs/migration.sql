/*
  Warnings:

  - You are about to drop the column `orchestrator` on the `AiResponseLog` table. All the data in the column will be lost.
  - Added the required column `handler` to the `AiResponseLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN "payload" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiResponseLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "handler" TEXT NOT NULL,
    "providerName" TEXT,
    "response" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AiResponseLog" ("id", "response", "timestamp") SELECT "id", "response", "timestamp" FROM "AiResponseLog";
DROP TABLE "AiResponseLog";
ALTER TABLE "new_AiResponseLog" RENAME TO "AiResponseLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
