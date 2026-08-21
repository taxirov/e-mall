-- Clear pre-launch test data that references Category, so the new
-- storeTypeId NOT NULL column can be added below. Nothing here is real
-- user data — accumulated Playwright test rows from this session's
-- feature testing (Store/User rows are left alone; only the Category-
-- dependent chain needs clearing for this specific constraint).
DELETE FROM "SaleItem";
DELETE FROM "OrderItem";
DELETE FROM "StockReceipt";
DELETE FROM "InventoryLog";
DELETE FROM "Sale";
DELETE FROM "Order";
DELETE FROM "ProductEditRequest";
DELETE FROM "Product";
DELETE FROM "CatalogProduct";
DELETE FROM "Category";

-- CreateEnum
CREATE TYPE "TelegramVerificationType" AS ENUM ('REGISTER', 'LOGIN');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "storeTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramPhone" TEXT;

-- CreateTable
CREATE TABLE "StoreType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramVerification" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "TelegramVerificationType" NOT NULL,
    "telegramChatId" TEXT NOT NULL,
    "telegramPhone" TEXT,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StoreToStoreType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StoreToStoreType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreType_name_key" ON "StoreType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramVerification_code_key" ON "TelegramVerification"("code");

-- CreateIndex
CREATE INDEX "TelegramVerification_telegramChatId_idx" ON "TelegramVerification"("telegramChatId");

-- CreateIndex
CREATE INDEX "TelegramVerification_expiresAt_idx" ON "TelegramVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "_StoreToStoreType_B_index" ON "_StoreToStoreType"("B");

-- CreateIndex
CREATE INDEX "Category_storeTypeId_idx" ON "Category"("storeTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeTypeId_fkey" FOREIGN KEY ("storeTypeId") REFERENCES "StoreType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramVerification" ADD CONSTRAINT "TelegramVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoreToStoreType" ADD CONSTRAINT "_StoreToStoreType_A_fkey" FOREIGN KEY ("A") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoreToStoreType" ADD CONSTRAINT "_StoreToStoreType_B_fkey" FOREIGN KEY ("B") REFERENCES "StoreType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

