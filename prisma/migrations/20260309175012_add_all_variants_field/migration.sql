-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "allVariants" TEXT[] DEFAULT ARRAY[]::TEXT[];
