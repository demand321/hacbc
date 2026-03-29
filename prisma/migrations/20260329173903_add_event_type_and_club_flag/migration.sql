-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('GENERAL', 'AMCAR', 'VETERAN', 'CRUISING');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventType" "EventType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "isClubEvent" BOOLEAN NOT NULL DEFAULT false;
