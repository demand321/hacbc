-- CreateTable
CREATE TABLE "CruisingEvent" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "routeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CruisingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CruisingPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "comment" TEXT,
    "eventId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CruisingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CruisingEvent_routeId_idx" ON "CruisingEvent"("routeId");

-- CreateIndex
CREATE INDEX "CruisingEvent_date_idx" ON "CruisingEvent"("date");

-- CreateIndex
CREATE INDEX "CruisingPhoto_eventId_idx" ON "CruisingPhoto"("eventId");

-- CreateIndex
CREATE INDEX "CruisingPhoto_uploadedById_idx" ON "CruisingPhoto"("uploadedById");

-- AddForeignKey
ALTER TABLE "CruisingEvent" ADD CONSTRAINT "CruisingEvent_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "CruisingRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CruisingPhoto" ADD CONSTRAINT "CruisingPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CruisingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CruisingPhoto" ADD CONSTRAINT "CruisingPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
