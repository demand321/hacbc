-- CreateTable
CREATE TABLE "CruisingSignup" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CruisingSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CruisingMessage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "signupId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CruisingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CruisingSignup_eventId_idx" ON "CruisingSignup"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "CruisingSignup_eventId_userId_key" ON "CruisingSignup"("eventId", "userId");

-- CreateIndex
CREATE INDEX "CruisingMessage_eventId_createdAt_idx" ON "CruisingMessage"("eventId", "createdAt");

-- AddForeignKey
ALTER TABLE "CruisingSignup" ADD CONSTRAINT "CruisingSignup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CruisingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CruisingSignup" ADD CONSTRAINT "CruisingSignup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CruisingMessage" ADD CONSTRAINT "CruisingMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CruisingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CruisingMessage" ADD CONSTRAINT "CruisingMessage_signupId_fkey" FOREIGN KEY ("signupId") REFERENCES "CruisingSignup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
