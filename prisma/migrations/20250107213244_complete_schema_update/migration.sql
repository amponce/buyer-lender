/*
  Warnings:

  - You are about to drop the column `annualSalary` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `carLoan` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `creditCard` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `creditScore` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `otherExpenses` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `propertyAddress` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `purchasePrice` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `Quote` table. All the data in the column will be lost.
  - Added the required column `interestRate` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lenderId` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loanTerm` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyPayment` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quoteRequestId` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "creditScore" INTEGER NOT NULL,
    "annualSalary" REAL NOT NULL,
    "additionalIncome" REAL,
    "carLoan" REAL NOT NULL,
    "creditCard" REAL NOT NULL,
    "otherExpenses" REAL NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "propertyAddress" TEXT,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "QuoteRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteRequestId" INTEGER NOT NULL,
    "lenderId" INTEGER NOT NULL,
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
INSERT INTO "new_Quote" ("createdAt", "id", "status", "updatedAt") SELECT "createdAt", "id", "status", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BUYER',
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "teamId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isManager", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "isManager", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
