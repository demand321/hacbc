import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "HACBC <noreply@hacbc.no>";
const MEMBERSHIP_NOTIFY_ADDRESS = process.env.EMAIL_MEMBERSHIP_NOTIFY ?? "post@hacbc.no";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function isTestEnvironment(): boolean {
  const url = process.env.NEXTAUTH_URL ?? "";
  try {
    return new URL(url).hostname !== "hacbc.no";
  } catch {
    return true;
  }
}

export interface MembershipApplicantInfo {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendMembershipApplicationEmail(applicant: MembershipApplicantInfo): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping membership notification email");
    return;
  }

  const testEnv = isTestEnvironment();
  const subjectPrefix = testEnv ? "[TEST] " : "";
  const testBanner = testEnv
    ? `<div style="background:#fde68a;border:1px solid #f59e0b;padding:8px 12px;margin-bottom:16px;border-radius:4px;font-size:14px;">
        <strong>⚠️ Test-miljø:</strong> denne søknaden ble sendt fra hacbc-dev og er ikke fra en ekte søker. Ingen handling kreves.
       </div>`
    : "";

  const safe = {
    name: escapeHtml(applicant.name),
    email: escapeHtml(applicant.email),
    phone: applicant.phone ? escapeHtml(applicant.phone) : "—",
    address: applicant.address ? escapeHtml(applicant.address) : "—",
    postalCode: applicant.postalCode ? escapeHtml(applicant.postalCode) : "—",
    city: applicant.city ? escapeHtml(applicant.city) : "—",
  };

  const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; color: #222; max-width: 600px;">
  ${testBanner}
  <h2 style="color: #b91c1c;">Ny medlemssøknad – HACBC</h2>
  <p>En person har søkt om medlemskap og venter på godkjenning.</p>
  <table style="border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 4px 12px 4px 0;"><strong>Navn:</strong></td><td>${safe.name}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0;"><strong>E-post:</strong></td><td>${safe.email}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0;"><strong>Telefon:</strong></td><td>${safe.phone}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0;"><strong>Adresse:</strong></td><td>${safe.address}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0;"><strong>Postnr / sted:</strong></td><td>${safe.postalCode} ${safe.city}</td></tr>
  </table>
  <p>Logg inn i admin-panelet for å godkjenne eller avslå søknaden:</p>
  <p><a href="https://hacbc.no/admin/medlemmer" style="background:#b91c1c;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px;">Gå til medlemshåndtering</a></p>
</body></html>`.trim();

  const text =
    (testEnv ? "[TEST-MILJØ — ingen handling kreves]\n\n" : "") +
    `Ny medlemssøknad – HACBC\n\n` +
    `Navn: ${applicant.name}\n` +
    `E-post: ${applicant.email}\n` +
    `Telefon: ${applicant.phone ?? "—"}\n` +
    `Adresse: ${applicant.address ?? "—"}\n` +
    `Postnr/sted: ${applicant.postalCode ?? "—"} ${applicant.city ?? ""}\n\n` +
    `Godkjenn eller avslå på https://hacbc.no/admin/medlemmer`;

  const ccRecipients = await prisma.user
    .findMany({
      where: {
        notifyOnMemberApplication: true,
        memberStatus: "APPROVED",
      },
      select: { email: true },
    })
    .then((rows) => rows.map((r) => r.email))
    .catch((err) => {
      console.error("[email] failed to load CC recipients:", err);
      return [] as string[];
    });

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: MEMBERSHIP_NOTIFY_ADDRESS,
    cc: ccRecipients.length > 0 ? ccRecipients : undefined,
    subject: `${subjectPrefix}Ny medlemssøknad: ${applicant.name}`,
    html,
    text,
  });

  if (error) {
    console.error("[email] failed to send membership notification:", error);
  }
}

export interface OrderEmailItem {
  productName: string;
  quantity: number;
  size?: string | null;
  variant?: string | null;
  priceInOre: number;
}

export interface OrderEmailInfo {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  items: OrderEmailItem[];
  note?: string | null;
}

function formatNOK(priceInOre: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInOre / 100);
}

export async function sendOrderNotificationEmail(order: OrderEmailInfo): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping order notification email");
    return;
  }

  const testEnv = isTestEnvironment();
  const subjectPrefix = testEnv ? "[TEST] " : "";
  const testBanner = testEnv
    ? `<div style="background:#fde68a;border:1px solid #f59e0b;padding:8px 12px;margin-bottom:16px;border-radius:4px;font-size:14px;">
        <strong>⚠️ Test-miljø:</strong> denne bestillingen ble sendt fra hacbc-dev og er ikke ekte. Ingen handling kreves.
       </div>`
    : "";

  const safe = {
    name: escapeHtml(order.customerName),
    email: escapeHtml(order.customerEmail),
    phone: order.customerPhone ? escapeHtml(order.customerPhone) : "—",
    note: order.note ? escapeHtml(order.note) : "—",
  };

  const total = order.items.reduce((sum, i) => sum + i.priceInOre * i.quantity, 0);

  const itemRowsHtml = order.items
    .map((item) => {
      const details = [
        item.size ? `str. ${escapeHtml(item.size)}` : null,
        item.variant ? escapeHtml(item.variant) : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `<tr>
        <td style="padding: 4px 12px 4px 0;">${escapeHtml(item.productName)}${details ? ` <span style="color:#666">(${details})</span>` : ""}</td>
        <td style="padding: 4px 12px 4px 0; text-align:right;">${item.quantity} ×</td>
        <td style="padding: 4px 0; text-align:right;">${formatNOK(item.priceInOre)}</td>
      </tr>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; color: #222; max-width: 600px;">
  ${testBanner}
  <h2 style="color: #b91c1c;">Ny bestilling – HACBC klubbshop</h2>
  <p><strong>${safe.name}</strong> (${safe.email}) har lagt inn en bestilling.</p>
  <table style="border-collapse: collapse; margin: 16px 0; width: 100%;">
    <thead>
      <tr style="border-bottom: 1px solid #ccc;">
        <th style="padding: 4px 12px 4px 0; text-align:left;">Produkt</th>
        <th style="padding: 4px 12px 4px 0; text-align:right;">Antall</th>
        <th style="padding: 4px 0; text-align:right;">Pris</th>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
    </tbody>
    <tfoot>
      <tr style="border-top: 1px solid #ccc; font-weight: bold;">
        <td colspan="2" style="padding: 8px 12px 4px 0; text-align:right;">Totalt:</td>
        <td style="padding: 8px 0 4px 0; text-align:right;">${formatNOK(total)}</td>
      </tr>
    </tfoot>
  </table>
  <table style="border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 4px 12px 4px 0;"><strong>Telefon:</strong></td><td>${safe.phone}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0; vertical-align: top;"><strong>Kommentar:</strong></td><td>${safe.note}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0;"><strong>Ordre-ID:</strong></td><td><code>${escapeHtml(order.orderId)}</code></td></tr>
  </table>
  <p><a href="https://hacbc.no/admin/shop" style="background:#b91c1c;color:#fff;padding:8px 16px;text-decoration:none;border-radius:4px;">Gå til shop-håndtering</a></p>
</body></html>`.trim();

  const itemLines = order.items
    .map((item) => {
      const details = [item.size ? `str. ${item.size}` : null, item.variant]
        .filter(Boolean)
        .join(", ");
      return `- ${item.productName}${details ? ` (${details})` : ""}: ${item.quantity} × ${formatNOK(item.priceInOre)}`;
    })
    .join("\n");

  const text =
    (testEnv ? "[TEST-MILJØ — ingen handling kreves]\n\n" : "") +
    `Ny bestilling – HACBC klubbshop\n\n` +
    `Kunde: ${order.customerName} (${order.customerEmail})\n` +
    `Telefon: ${order.customerPhone ?? "—"}\n` +
    `Kommentar: ${order.note ?? "—"}\n` +
    `Ordre-ID: ${order.orderId}\n\n` +
    `${itemLines}\n\n` +
    `Totalt: ${formatNOK(total)}\n\n` +
    `Håndter bestillingen på https://hacbc.no/admin/shop`;

  const ccRecipients = await prisma.user
    .findMany({
      where: {
        notifyOnShopOrder: true,
        memberStatus: "APPROVED",
      },
      select: { email: true },
    })
    .then((rows) => rows.map((r) => r.email))
    .catch((err) => {
      console.error("[email] failed to load shop CC recipients:", err);
      return [] as string[];
    });

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: MEMBERSHIP_NOTIFY_ADDRESS,
    cc: ccRecipients.length > 0 ? ccRecipients : undefined,
    subject: `${subjectPrefix}Ny bestilling: ${order.customerName}`,
    html,
    text,
  });

  if (error) {
    console.error("[email] failed to send order notification:", error);
  }
}
