-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costPrice" DECIMAL(12,2),
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "mxikItemId" TEXT;

-- CreateTable
CREATE TABLE "MxikItem" (
    "id" TEXT NOT NULL,
    "mxikCode" TEXT NOT NULL,
    "mxikName" TEXT NOT NULL,
    "groupName" TEXT,
    "className" TEXT,
    "positionName" TEXT,
    "subpositionName" TEXT,
    "brandName" TEXT,
    "attributeName" TEXT,
    "barcode" TEXT,
    "unit" TEXT,
    "packaging" TEXT,

    CONSTRAINT "MxikItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReceipt" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPrice" DECIMAL(12,2) NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "supplier" TEXT,
    "receivedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MxikItem_mxikCode_key" ON "MxikItem"("mxikCode");

-- CreateIndex
CREATE INDEX "MxikItem_mxikName_idx" ON "MxikItem"("mxikName");

-- CreateIndex
CREATE INDEX "MxikItem_groupName_idx" ON "MxikItem"("groupName");

-- CreateIndex
CREATE INDEX "StockReceipt_storeId_idx" ON "StockReceipt"("storeId");

-- CreateIndex
CREATE INDEX "StockReceipt_productId_idx" ON "StockReceipt"("productId");

-- CreateIndex
CREATE INDEX "StockReceipt_storeId_createdAt_idx" ON "StockReceipt"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_mxikItemId_idx" ON "Product"("mxikItemId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_mxikItemId_fkey" FOREIGN KEY ("mxikItemId") REFERENCES "MxikItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReceipt" ADD CONSTRAINT "StockReceipt_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

