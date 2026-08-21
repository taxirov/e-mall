-- AlterTable
ALTER TABLE "MxikItem" ADD COLUMN     "imageCheckedAt" TIMESTAMP(3),
ADD COLUMN     "imageUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Category_storeId_name_key" ON "Category"("storeId", "name");

