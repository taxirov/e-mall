-- CreateEnum
CREATE TYPE "ProductAttributeType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT');

-- AlterTable
ALTER TABLE "CatalogProduct" ADD COLUMN     "mxikCode" TEXT,
ADD COLUMN     "soliqBrand" TEXT,
ADD COLUMN     "soliqId" TEXT,
ADD COLUMN     "soliqPosition" TEXT;

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductAttributeType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProductAttributeValue" (
    "id" TEXT NOT NULL,
    "catalogProductId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "CatalogProductAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_name_key" ON "ProductAttribute"("name");

-- CreateIndex
CREATE INDEX "CatalogProductAttributeValue_catalogProductId_idx" ON "CatalogProductAttributeValue"("catalogProductId");

-- CreateIndex
CREATE INDEX "CatalogProductAttributeValue_attributeId_idx" ON "CatalogProductAttributeValue"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProductAttributeValue_catalogProductId_attributeId_key" ON "CatalogProductAttributeValue"("catalogProductId", "attributeId");

-- AddForeignKey
ALTER TABLE "CatalogProductAttributeValue" ADD CONSTRAINT "CatalogProductAttributeValue_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProductAttributeValue" ADD CONSTRAINT "CatalogProductAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
