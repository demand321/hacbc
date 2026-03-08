-- CreateTable
CREATE TABLE "PhotoComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "userId" TEXT,
    "galleryPhotoId" TEXT,
    "cruisingPhotoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoLike" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "userId" TEXT,
    "galleryPhotoId" TEXT,
    "cruisingPhotoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhotoComment_galleryPhotoId_idx" ON "PhotoComment"("galleryPhotoId");

-- CreateIndex
CREATE INDEX "PhotoComment_cruisingPhotoId_idx" ON "PhotoComment"("cruisingPhotoId");

-- CreateIndex
CREATE INDEX "PhotoLike_galleryPhotoId_idx" ON "PhotoLike"("galleryPhotoId");

-- CreateIndex
CREATE INDEX "PhotoLike_cruisingPhotoId_idx" ON "PhotoLike"("cruisingPhotoId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoLike_userId_galleryPhotoId_key" ON "PhotoLike"("userId", "galleryPhotoId");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoLike_userId_cruisingPhotoId_key" ON "PhotoLike"("userId", "cruisingPhotoId");

-- AddForeignKey
ALTER TABLE "PhotoComment" ADD CONSTRAINT "PhotoComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoComment" ADD CONSTRAINT "PhotoComment_galleryPhotoId_fkey" FOREIGN KEY ("galleryPhotoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoComment" ADD CONSTRAINT "PhotoComment_cruisingPhotoId_fkey" FOREIGN KEY ("cruisingPhotoId") REFERENCES "CruisingPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoLike" ADD CONSTRAINT "PhotoLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoLike" ADD CONSTRAINT "PhotoLike_galleryPhotoId_fkey" FOREIGN KEY ("galleryPhotoId") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoLike" ADD CONSTRAINT "PhotoLike_cruisingPhotoId_fkey" FOREIGN KEY ("cruisingPhotoId") REFERENCES "CruisingPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
