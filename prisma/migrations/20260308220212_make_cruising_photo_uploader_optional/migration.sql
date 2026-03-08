-- DropForeignKey
ALTER TABLE "CruisingPhoto" DROP CONSTRAINT "CruisingPhoto_uploadedById_fkey";

-- AlterTable
ALTER TABLE "CruisingPhoto" ADD COLUMN     "uploaderName" TEXT,
ALTER COLUMN "uploadedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CruisingPhoto" ADD CONSTRAINT "CruisingPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
