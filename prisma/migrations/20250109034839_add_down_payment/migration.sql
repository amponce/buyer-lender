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
    "downPaymentAmount" REAL NOT NULL DEFAULT 0,
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
INSERT INTO "new_QuoteRequest" ("annualIncome", "buyerId", "createdAt", "creditScore", "employmentStatus", "employmentYears", "id", "monthlyCarLoan", "monthlyCreditCard", "monthlyOtherExpenses", "propertyAddress", "propertyCity", "propertyState", "propertyZipCode", "purchasePrice", "status", "updatedAt") SELECT "annualIncome", "buyerId", "createdAt", "creditScore", "employmentStatus", "employmentYears", "id", "monthlyCarLoan", "monthlyCreditCard", "monthlyOtherExpenses", "propertyAddress", "propertyCity", "propertyState", "propertyZipCode", "purchasePrice", "status", "updatedAt" FROM "QuoteRequest";
DROP TABLE "QuoteRequest";
ALTER TABLE "new_QuoteRequest" RENAME TO "QuoteRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
