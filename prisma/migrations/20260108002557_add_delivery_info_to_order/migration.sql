/*
  Warnings:

  - You are about to drop the column `deliveryAddress` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryTimeSlot` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryTimeSlot" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "deliveryAddress",
DROP COLUMN "deliveryTimeSlot";
