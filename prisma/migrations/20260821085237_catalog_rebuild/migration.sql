-- Clear pre-launch test data that references Product, so the new
-- catalogProductId NOT NULL column can be added below. Nothing here is
-- real user data (confirmed: 1 test product/sale/category from early
-- testing) — see plan notes for the catalog rebuild.
DELETE FROM "SaleItem";
DELETE FROM "OrderItem";
DELETE FROM "StockReceipt";
DELETE FROM "InventoryLog";
DELETE FROM "Sale";
DELETE FROM "Order";
DELETE FROM "Product";

-- CreateEnum
CREATE TYPE "EditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_mxikItemId_fkey";

-- DropIndex
DROP INDEX "Category_storeId_idx";

-- DropIndex
DROP INDEX "Category_storeId_name_key";

-- DropIndex
DROP INDEX "Product_mxikItemId_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "storeId",
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "categoryId",
DROP COLUMN "images",
DROP COLUMN "mxikItemId",
DROP COLUMN "name",
ADD COLUMN     "catalogProductId" TEXT NOT NULL,
ADD COLUMN     "lowStockThreshold" INTEGER;

-- DropTable
DROP TABLE "MxikItem";

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT,
    "unit" TEXT NOT NULL,
    "size" TEXT,
    "barcode" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdByStoreId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEditRequest" (
    "id" TEXT NOT NULL,
    "catalogProductId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "note" TEXT,
    "status" "EditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogProduct_categoryId_idx" ON "CatalogProduct"("categoryId");

-- CreateIndex
CREATE INDEX "CatalogProduct_name_idx" ON "CatalogProduct"("name");

-- CreateIndex
CREATE INDEX "CatalogProduct_createdByStoreId_idx" ON "CatalogProduct"("createdByStoreId");

-- CreateIndex
CREATE INDEX "ProductEditRequest_catalogProductId_idx" ON "ProductEditRequest"("catalogProductId");

-- CreateIndex
CREATE INDEX "ProductEditRequest_status_idx" ON "ProductEditRequest"("status");

-- CreateIndex
CREATE INDEX "ProductEditRequest_storeId_idx" ON "ProductEditRequest"("storeId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_parentId_name_key" ON "Category"("parentId", "name");

-- CreateIndex
CREATE INDEX "Product_catalogProductId_idx" ON "Product"("catalogProductId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_catalogProductId_key" ON "Product"("storeId", "catalogProductId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_createdByStoreId_fkey" FOREIGN KEY ("createdByStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEditRequest" ADD CONSTRAINT "ProductEditRequest_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEditRequest" ADD CONSTRAINT "ProductEditRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEditRequest" ADD CONSTRAINT "ProductEditRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEditRequest" ADD CONSTRAINT "ProductEditRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

