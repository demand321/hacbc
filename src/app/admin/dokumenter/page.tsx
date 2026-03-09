import { prisma } from "@/lib/prisma";
import { DocumentActions } from "./DocumentActions";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  const serialized = documents.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    url: d.url,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    uploadedBy: d.uploadedBy.name,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div>
      <h2 className="mb-6 font-[family-name:var(--font-heading)] text-2xl font-bold uppercase">
        Klubbdokumenter
      </h2>
      <DocumentActions documents={serialized} />
    </div>
  );
}
