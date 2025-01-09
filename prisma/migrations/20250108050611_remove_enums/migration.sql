/*
  Warnings:

  - You are about to drop the column `annualSalary` on the `QuoteRequest` table. All the data in the column will be lost.
  - You are about to drop the column `carLoan` on the `QuoteRequest` table. All the data in the column will be lost.
  - You are about to drop the column `creditCard` on the `QuoteRequest` table. All the data in the column will be lost.
  - You are about to drop the column `otherExpenses` on the `QuoteRequest` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `QuoteRequest` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `QuoteRequest` table. All the data in the column will be lost.
  - Added the required column `annualIncome` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyCarLoan` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyCreditCard` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyOtherExpenses` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyState` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyZipCode` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `additionalIncome` on table `QuoteRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuoteRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
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
INSERT INTO "new_QuoteRequest" ("additionalIncome", "createdAt", "creditScore", "id", "propertyAddress", "purchasePrice", "status", "updatedAt", "userId") SELECT "additionalIncome", "createdAt", "creditScore", "id", "propertyAddress", "purchasePrice", "status", "updatedAt", "userId" FROM "QuoteRequest";
DROP TABLE "QuoteRequest";
ALTER TABLE "new_QuoteRequest" RENAME TO "QuoteRequest";
CREATE INDEX "QuoteRequest_userId_idx" ON "QuoteRequest"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
