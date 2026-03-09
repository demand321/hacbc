-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "variant" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "variants" TEXT[] DEFAULT ARRAY[]::TEXT[];
