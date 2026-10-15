export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PrintButton } from "./PrintButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id, published: true },
  });
  if (!vehicle) return { title: "Plakat" };
  return {
    title: `Plakat: ${vehicle.make} ${vehicle.model}`,
    robots: { index: false, follow: false },
  };
}

export default async function VehiclePosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/logg-inn?callbackUrl=/kjoretoy/${id}/plakat`);
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id, published: true },
    include: {
      owner: { select: { id: true, name: true, memberStatus: true } },
    },
  });

  if (!vehicle || vehicle.owner.memberStatus === "DELETED") notFound();

  const isOwner = vehicle.owner.id === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) notFound();

  const specs =
    vehicle.specs && typeof vehicle.specs === "object"
      ? (vehicle.specs as Record<string, string>)
      : null;

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://hacbc.no";
  const vehicleUrl = `${baseUrl.replace(/\/$/, "")}/kjoretoy/${id}`;
  const qrSvgRaw = await QRCode.toString(vehicleUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const qrSvg = qrSvgRaw
    .replace(/\swidth="[^"]*"/, ' width="100%"')
    .replace(/\sheight="[^"]*"/, ' height="100%"');

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          nav, footer, .no-print { display: none !important; }
          html, body { background: white !important; }
          main { padding: 0 !important; }
          .poster-sheet {
            margin: 0 !important;
            box-shadow: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            page-break-after: avoid;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-200 py-8 print:bg-white print:py-0">
        <div className="no-print mx-auto mb-6 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
          <Button variant="ghost" asChild>
            <Link href={`/kjoretoy/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake
            </Link>
          </Button>
          <PrintButton />
        </div>

        <article
          className="poster-sheet mx-auto bg-white text-black shadow-2xl print:shadow-none"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "15mm",
            display: "flex",
            flexDirection: "column",
            gap: "7mm",
            fontFamily: "'Inter', 'Helvetica', 'Arial', sans-serif",
            boxSizing: "border-box",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "3px solid #000",
              paddingBottom: "4mm",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="HACBC"
              style={{ height: "22mm", width: "auto" }}
            />
            <div
              style={{
                textAlign: "right",
                fontSize: "9pt",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                lineHeight: 1.3,
              }}
            >
              <div style={{ fontWeight: 700 }}>Hamar American</div>
              <div style={{ fontWeight: 700 }}>Car &amp; Bike Club</div>
            </div>
          </header>

          {vehicle.imageUrls[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.imageUrls[0]}
              alt=""
              style={{
                width: "100%",
                height: "95mm",
                objectFit: "cover",
                borderRadius: "2mm",
                display: "block",
              }}
            />
          )}

          <div>
            <h1
              style={{
                fontSize: "34pt",
                fontWeight: 900,
                lineHeight: 1,
                margin: 0,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.year && (
              <p
                style={{
                  fontSize: "22pt",
                  fontWeight: 600,
                  margin: "2mm 0 0 0",
                  color: "#444",
                }}
              >
                {vehicle.year}
              </p>
            )}
            <p style={{ fontSize: "11pt", margin: "4mm 0 0 0" }}>
              Eier: <strong>{vehicle.owner.name}</strong>
            </p>
          </div>

          {vehicle.description && (
            <p
              style={{
                fontSize: "11pt",
                lineHeight: 1.5,
                margin: 0,
                whiteSpace: "pre-line",
              }}
            >
              {vehicle.description}
            </p>
          )}

          {specs && Object.keys(specs).length > 0 && (
            <div>
              <h2
                style={{
                  fontSize: "13pt",
                  fontWeight: 800,
                  margin: "0 0 2mm 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Spesifikasjoner
              </h2>
              <table
                style={{
                  width: "100%",
                  fontSize: "10.5pt",
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  {Object.entries(specs).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: "1px solid #ddd" }}>
                      <td
                        style={{
                          padding: "2mm 0",
                          fontWeight: 600,
                          width: "40%",
                        }}
                      >
                        {k}
                      </td>
                      <td style={{ padding: "2mm 0" }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              gap: "6mm",
              borderTop: "3px solid #000",
              paddingTop: "4mm",
            }}
          >
            <div
              style={{ width: "32mm", height: "32mm", flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div style={{ fontSize: "10pt", flex: 1 }}>
              <div
                style={{
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "1.5mm",
                }}
              >
                Skann for mer info
              </div>
              <div style={{ color: "#555" }}>
                {vehicleUrl.replace(/^https?:\/\//, "")}
              </div>
            </div>
            <div
              style={{
                fontSize: "9pt",
                textAlign: "right",
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              hacbc.no
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}
