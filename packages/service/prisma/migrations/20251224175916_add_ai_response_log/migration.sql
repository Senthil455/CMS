-- CreateTable
CREATE TABLE "AiResponseLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orchestrator" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
