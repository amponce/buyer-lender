/*
  Warnings:

  - Added the required column `lenderId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- First, create a temporary table to store message-lender mappings
-- Using MIN to get the first lender for each message
CREATE TABLE "_MessageLenderMap" AS
SELECT m.id as messageId, MIN(q.lenderId) as lenderId
FROM "Message" m
JOIN "QuoteRequest" qr ON m.requestId = qr.id
JOIN "Quote" q ON qr.id = q.quoteRequestId
GROUP BY m.id;

CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Insert existing messages with their corresponding lenderId
INSERT INTO "new_Message" ("id", "requestId", "senderId", "lenderId", "content", "createdAt")
SELECT DISTINCT m.id, m.requestId, m.senderId, mlm.lenderId, m.content, m.createdAt
FROM "Message" m
JOIN "_MessageLenderMap" mlm ON m.id = mlm.messageId;

-- Clean up
DROP TABLE "_MessageLenderMap";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";

-- Create indexes
CREATE INDEX "Message_requestId_idx" ON "Message"("requestId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_lenderId_idx" ON "Message"("lenderId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
