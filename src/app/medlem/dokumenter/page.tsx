import { prisma } from "@/lib/prisma";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PPT";
  if (mimeType.includes("image")) return "IMG";
  if (mimeType.includes("text")) return "TXT";
  return "FIL";
}

export default async function MemberDocumentsPage() {
  const documents = await prisma.clubDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
          Klubb<span className="text-primary">dokumenter</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Her finner du vedtekter, referater, og andre viktige dokumenter for klubben.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Ingen dokumenter er lastet opp ennå.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="border-border transition-colors hover:border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {getFileIcon(doc.mimeType)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{doc.title}</p>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{doc.fileName}</span>
                        <span>&middot;</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>&middot;</span>
                        <span>
                          {doc.createdAt.toLocaleDateString("nb-NO")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-1.5 h-4 w-4" />
                      Last ned
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
