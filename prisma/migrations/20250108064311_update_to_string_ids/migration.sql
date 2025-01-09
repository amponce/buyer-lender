/*
  Warnings:

  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Quote` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `QuoteRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "id", "requestId", "senderId") SELECT "content", "createdAt", "id", "requestId", "senderId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_requestId_idx" ON "Message"("requestId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteRequestId" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "interestRate" REAL NOT NULL,
    "loanTerm" INTEGER NOT NULL,
    "monthlyPayment" REAL NOT NULL,
    "additionalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("additionalNotes", "createdAt", "id", "interestRate", "lenderId", "loanTerm", "monthlyPayment", "quoteRequestId", "status", "updatedAt") SELECT "additionalNotes", "createdAt", "id", "interestRate", "lenderId", "loanTerm", "monthlyPayment", "quoteRequestId", "status", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE INDEX "Quote_quoteRequestId_idx" ON "Quote"("quoteRequestId");
CREATE INDEX "Quote_lenderId_idx" ON "Quote"("lenderId");
CREATE TABLE "new_QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "creditScore" INTEGER NOT NULL,
    "annualIncome" REAL NOT NULL,
    "additionalIncome" REAL NOT NULL,
    "monthlyCarLoan" REAL NOT NULL,
    "monthlyCreditCard" REAL NOT NULL,
    "monthlyOtherExpenses" REAL NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "propertyAddress" TEXT,
    "propertyState" TEXT NOT NULL,
    "propertyZipCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QuoteRequest" ("additionalIncome", "annualIncome", "createdAt", "creditScore", "id", "monthlyCarLoan", "monthlyCreditCard", "monthlyOtherExpenses", "propertyAddress", "propertyState", "propertyZipCode", "purchasePrice", "status", "updatedAt", "userId") SELECT "additionalIncome", "annualIncome", "createdAt", "creditScore", "id", "monthlyCarLoan", "monthlyCreditCard", "monthlyOtherExpenses", "propertyAddress", "propertyState", "propertyZipCode", "purchasePrice", "status", "updatedAt", "userId" FROM "QuoteRequest";
DROP TABLE "QuoteRequest";
ALTER TABLE "new_QuoteRequest" RENAME TO "QuoteRequest";
CREATE INDEX "QuoteRequest_userId_idx" ON "QuoteRequest"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BUYER',
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isManager", "password", "role", "teamId", "updatedAt") SELECT "createdAt", "email", "id", "isManager", "password", "role", "teamId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
