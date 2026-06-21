-- AlterTable
ALTER TABLE "Order" ADD COLUMN "asaasCustomerId" TEXT;
ALTER TABLE "Order" ADD COLUMN "asaasPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "pixEncodedImage" TEXT;
ALTER TABLE "Order" ADD COLUMN "pixExpiresAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "pixPayload" TEXT;

-- CreateIndex
CREATE INDEX "Order_asaasPaymentId_idx" ON "Order"("asaasPaymentId");
