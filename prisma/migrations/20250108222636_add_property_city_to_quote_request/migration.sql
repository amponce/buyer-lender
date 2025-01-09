/*
  Warnings:

  - You are about to drop the column `additionalIncome` on the `QuoteRequest` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `QuoteRequest` table. All the data in the column will be lost.
  - Added the required column `buyerId` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyCity` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `propertyAddress` on table `QuoteRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "EmploymentHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employer" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "currentJob" BOOLEAN NOT NULL DEFAULT false,
    "monthlyIncome" REAL NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    CONSTRAINT "EmploymentHistory_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuoteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "propertyAddress" TEXT NOT NULL,
    "propertyCity" TEXT NOT NULL,
    "propertyState" TEXT NOT NULL,
    "propertyZipCode" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "creditScore" INTEGER NOT NULL,
    "annualIncome" REAL NOT NULL,
    "monthlyCarLoan" REAL NOT NULL DEFAULT 0,
    "monthlyCreditCard" REAL NOT NULL DEFAULT 0,
    "monthlyOtherExpenses" REAL NOT NULL DEFAULT 0,
    "employmentStatus" TEXT NOT NULL DEFAULT 'EMPLOYED',
    "employmentYears" REAL NOT NULL DEFAULT 0,
    "buyerId" TEXT NOT NULL,
    CONSTRAINT "QuoteRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QuoteRequest" ("annualIncome", "createdAt", "creditScore", "id", "monthlyCarLoan", "monthlyCreditCard", "monthlyOtherExpenses", "propertyAddress", "propertyState", "propertyZipCode", "purchasePrice", "status", "updatedAt") SELECT "annualIncome", "createdAt", "creditScore", "id", "monthlyCarLoan", "monthlyCreditCard", "monthlyOtherExpenses", "propertyAddress", "propertyState", "propertyZipCode", "purchasePrice", "status", "updatedAt" FROM "QuoteRequest";
DROP TABLE "QuoteRequest";
ALTER TABLE "new_QuoteRequest" RENAME TO "QuoteRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
