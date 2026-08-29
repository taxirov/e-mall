-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "courierOrderId" TEXT,
ADD COLUMN     "courierStatus" TEXT,
ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "courierPhone" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "useEcourier" BOOLEAN NOT NULL DEFAULT true;
