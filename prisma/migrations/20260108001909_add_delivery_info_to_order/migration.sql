-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "deliveryAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryTimeSlot" TEXT DEFAULT '';
