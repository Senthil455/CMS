-- AlterTable
ALTER TABLE "AiResponseLog" ADD COLUMN "schemaId" TEXT;

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);
