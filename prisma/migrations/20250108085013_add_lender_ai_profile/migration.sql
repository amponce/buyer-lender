-- CreateTable
CREATE TABLE "LenderAIProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lenderId" TEXT NOT NULL,
    "isAutopilotActive" BOOLEAN NOT NULL DEFAULT false,
    "rateSheet" TEXT NOT NULL,
    "guidelines" TEXT NOT NULL,
    "productInfo" TEXT NOT NULL,
    "faqResponses" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LenderAIProfile_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aiProfileId" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "summary" TEXT,
    "nextSteps" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIConversation_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "LenderAIProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AIConversation_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiConversationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_aiConversationId_fkey" FOREIGN KEY ("aiConversationId") REFERENCES "AIConversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "id", "lenderId", "requestId", "senderId") SELECT "content", "createdAt", "id", "lenderId", "requestId", "senderId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_requestId_idx" ON "Message"("requestId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_lenderId_idx" ON "Message"("lenderId");
CREATE INDEX "Message_aiConversationId_idx" ON "Message"("aiConversationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LenderAIProfile_lenderId_key" ON "LenderAIProfile"("lenderId");

-- CreateIndex
CREATE INDEX "AIConversation_aiProfileId_idx" ON "AIConversation"("aiProfileId");

-- CreateIndex
CREATE INDEX "AIConversation_quoteRequestId_idx" ON "AIConversation"("quoteRequestId");
