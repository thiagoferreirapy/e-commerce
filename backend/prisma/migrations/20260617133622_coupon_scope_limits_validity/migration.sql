-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Coupon" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "minSubtotal" REAL,
    "description" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'all',
    "scopeValue" TEXT,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" DATETIME,
    "expiresAt" DATETIME
);
INSERT INTO "new_Coupon" ("code", "description", "minSubtotal", "type", "value") SELECT "code", "description", "minSubtotal", "type", "value" FROM "Coupon";
DROP TABLE "Coupon";
ALTER TABLE "new_Coupon" RENAME TO "Coupon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
