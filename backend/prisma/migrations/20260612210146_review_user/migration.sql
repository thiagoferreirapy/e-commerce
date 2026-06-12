-- AlterTable
ALTER TABLE "Review" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
