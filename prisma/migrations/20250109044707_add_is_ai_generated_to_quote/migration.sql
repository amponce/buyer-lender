-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteRequestId" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "interestRate" REAL NOT NULL,
    "loanTerm" INTEGER NOT NULL,
    "monthlyPayment" REAL NOT NULL,
    "additionalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("additionalNotes", "createdAt", "id", "interestRate", "lenderId", "loanTerm", "monthlyPayment", "quoteRequestId", "status", "updatedAt") SELECT "additionalNotes", "createdAt", "id", "interestRate", "lenderId", "loanTerm", "monthlyPayment", "quoteRequestId", "status", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE INDEX "Quote_quoteRequestId_idx" ON "Quote"("quoteRequestId");
CREATE INDEX "Quote_lenderId_idx" ON "Quote"("lenderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
