export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "./PrintButton";
import { BackButton } from "@/components/BackButton";

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

  // Poster is physical and may outlive deployments; QR must always resolve to
  // the live public site regardless of where the poster was generated.
  const vehicleUrl = `https://hacbc.no/kjoretoy/${id}`;
  const qrSvgRaw = await QRCode.toString(vehicleUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#0a0a0a", light: "#ffffff" },
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
          html, body { background: #0a0a0a !important; }
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

      <div className="min-h-screen bg-slate-200 py-8 print:bg-[#0a0a0a] print:py-0">
        <div className="no-print mx-auto mb-6 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
          <BackButton fallbackHref={`/kjoretoy/${id}`} />
          <PrintButton />
        </div>

        <article
          className="poster-sheet mx-auto shadow-2xl print:shadow-none"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "15mm",
            display: "flex",
            flexDirection: "column",
            gap: "7mm",
            fontFamily: "'Inter', 'Helvetica', 'Arial', sans-serif",
            boxSizing: "border-box",
            background: "#0a0a0a",
            color: "#f5f5f4",
            border: "2px dashed #f59e0b",
            borderTop: "none",
            borderBottom: "none",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "3px solid #f59e0b",
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
                color: "#f5f5f4",
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
                border: "1px solid #27272a",
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
                color: "#f5f5f4",
              }}
            >
              {vehicle.make} {vehicle.model}
              {vehicle.year && (
                <span style={{ color: "#f59e0b" }}> &apos;{String(vehicle.year).slice(-2)}</span>
              )}
            </h1>
            <p
              style={{
                fontSize: "11pt",
                fontWeight: 700,
                margin: "3mm 0 0 0",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#f59e0b",
              }}
            >
              Eier: {vehicle.owner.name}
            </p>
          </div>

          {vehicle.description && (
            <p
              style={{
                fontSize: "11pt",
                lineHeight: 1.5,
                margin: 0,
                whiteSpace: "pre-line",
                color: "#d4d4d8",
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
                  margin: "0 0 3mm 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#f59e0b",
                }}
              >
                Spesifikasjoner
              </h2>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  fontSize: "10.5pt",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5mm",
                }}
              >
                {Object.entries(specs).map(([k, v]) => (
                  <li
                    key={k}
                    style={{
                      display: "flex",
                      gap: "2mm",
                    }}
                  >
                    <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                      &bull;
                    </span>
                    <span>
                      <strong style={{ color: "#f5f5f4" }}>{k}:</strong>{" "}
                      <span style={{ color: "#d4d4d8" }}>{v}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <footer
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              gap: "6mm",
              borderTop: "3px solid #f59e0b",
              paddingTop: "4mm",
            }}
          >
            <div
              style={{
                width: "32mm",
                height: "32mm",
                flexShrink: 0,
                background: "#ffffff",
                borderRadius: "1.5mm",
                padding: "2mm",
                boxSizing: "border-box",
              }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <div style={{ fontSize: "10pt", flex: 1 }}>
              <div
                style={{
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "1.5mm",
                  color: "#f5f5f4",
                }}
              >
                Skann for mer info
              </div>
              <div style={{ color: "#a1a1aa" }}>
                {vehicleUrl.replace(/^https?:\/\//, "")}
              </div>
            </div>
            <div
              style={{
                fontSize: "9pt",
                textAlign: "right",
                color: "#f59e0b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
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
