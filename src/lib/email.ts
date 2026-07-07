import nodemailer, { type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM =
  process.env.SMTP_FROM ?? "Sahasdhanavi Security System <noreply@sahasdhanavi.com>";

export const ADMIN_NOTIFY_EMAIL =
  process.env.ADMIN_NOTIFY_EMAIL ?? "NuwanRasika@gmail.com";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return transporter;
}

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{
  delivered: boolean;
  reason?: string;
}> {
  const tx = getTransporter();
  if (!tx) {
    console.warn(
      `[email] SMTP not configured — would have sent "${input.subject}" to ${String(input.to)}`,
    );
    return { delivered: false, reason: "SMTP not configured" };
  }
  try {
    await tx.sendMail({
      from: SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { delivered: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return {
      delivered: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}

/* ───────────────────────────────────────────────────────────
   HTML template helpers — Sahasdhanavi branded, dark theme
   ─────────────────────────────────────────────────────────── */

function baseTemplate(title: string, bodyHtml: string, ctaUrl?: string, ctaLabel?: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#19183B;font-family:Inter,Arial,sans-serif;color:#FFFFF0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#19183B;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0"
                 style="max-width:600px;background:#1F1E47;border:1px solid #2A2A58;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #2A2A58;background:linear-gradient(135deg,#146C94 0%,#7FC7D9 100%)">
                <table width="100%"><tr>
                  <td>
                    <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#FFFFF0;opacity:.85;font-family:'Courier New',monospace">
                      Sahasdhanavi Construction
                    </div>
                    <div style="font-size:18px;font-weight:600;color:#FFFFF0;margin-top:4px;">
                      Security &amp; HSEQ System
                    </div>
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#FFFFF0;letter-spacing:-.01em;">
                  ${escapeHtml(title)}
                </h1>
                <div style="font-size:14px;line-height:1.65;color:#E7F2EF;">
                  ${bodyHtml}
                </div>
                ${
                  ctaUrl && ctaLabel
                    ? `<div style="margin-top:28px;">
                         <a href="${escapeAttr(ctaUrl)}"
                            style="display:inline-block;padding:12px 22px;border-radius:10px;background:#7FC7D9;color:#19183B;font-weight:600;text-decoration:none;font-size:14px;">
                           ${escapeHtml(ctaLabel)}
                         </a>
                       </div>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #2A2A58;background:#161534;">
                <div style="font-size:11px;color:#A1C2BD;line-height:1.6;">
                  This is an automated message from the Sahasdhanavi Construction Security System.
                  Please do not reply directly to this email.
                </div>
              </td>
            </tr>
          </table>
          <div style="font-size:11px;color:#708993;margin-top:14px;font-family:'Courier New',monospace">
            © ${new Date().getFullYear()} Sahasdhanavi Construction (Pvt) Ltd
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function statRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #2A2A58;font-size:12px;color:#A1C2BD;width:45%;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #2A2A58;font-size:13px;color:#FFFFF0;font-weight:500;">${escapeHtml(value)}</td>
    </tr>`;
}

/* ───────────────────────────────────────────────────────────
   1. notifyAdminNewRegistration
   ─────────────────────────────────────────────────────────── */
interface NewRegistrationInput {
  registrationId: string;
  companyName: string;
  email: string;
  scopeOfWork: string;
  labourCount: number;
  vehicleCount: number;
  electricalEquipmentCount: number;
  nonElectricalToolsCount: number;
  baseUrl: string;
}

export async function notifyAdminNewRegistration(input: NewRegistrationInput) {
  const subject = `New Contractor Registration Request — ${input.companyName}`;
  const adminUrl = `${input.baseUrl}/admin/registrations/${input.registrationId}`;

  const body = `
    <p style="margin:0 0 14px;">
      A new contractor has submitted a self-registration request and is awaiting review.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
      ${statRow("Company Name", input.companyName)}
      ${statRow("Contact Email", input.email)}
      ${statRow("Scope of Work", input.scopeOfWork.slice(0, 140) + (input.scopeOfWork.length > 140 ? "…" : ""))}
      ${statRow("Labour", String(input.labourCount))}
      ${statRow("Vehicles", String(input.vehicleCount))}
      ${statRow("Electrical Equipment", String(input.electricalEquipmentCount))}
      ${statRow("Non-Electrical Tools", String(input.nonElectricalToolsCount))}
    </table>
  `;

  return sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject,
    html: baseTemplate(
      "New Contractor Registration",
      body,
      adminUrl,
      "Review in Admin Console",
    ),
  });
}

/* ───────────────────────────────────────────────────────────
   2. notifyContractorApproval
   ─────────────────────────────────────────────────────────── */
interface ApprovalInput {
  to: string;
  companyName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}

export async function notifyContractorApproval(input: ApprovalInput) {
  const subject = `Your Registration is Approved — Sahasdhanavi System`;

  const body = `
    <p style="margin:0 0 14px;">
      Welcome aboard, <strong>${escapeHtml(input.companyName)}</strong>. Your contractor
      registration has been approved by the Sahasdhanavi Admin team. Your account is ready.
    </p>

    <div style="margin:18px 0;padding:18px;background:#19183B;border:1px solid #2A2A58;border-radius:12px;">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#7FC7D9;margin-bottom:10px;font-family:'Courier New',monospace">
        Your Credentials
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${statRow("Email", input.email)}
        ${statRow("Temporary Password", input.temporaryPassword)}
      </table>
    </div>

    <p style="margin:0 0 8px;">
      For security, you will be asked to change this password on first sign-in.
    </p>
    <p style="margin:0;color:#A1C2BD;font-size:12px;">
      Keep these credentials confidential — do not share them with anyone.
    </p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    html: baseTemplate(
      "Registration Approved",
      body,
      input.loginUrl,
      "Sign in to Your Console",
    ),
  });
}

/* ───────────────────────────────────────────────────────────
   3. notifyContractorRejection (rejection OR corrections)
   ─────────────────────────────────────────────────────────── */
interface RejectionInput {
  to: string;
  companyName: string;
  reason: string;
  mode: "REJECTED" | "CORRECTIONS_REQUESTED";
}

export async function notifyContractorRejection(input: RejectionInput) {
  const isCorrections = input.mode === "CORRECTIONS_REQUESTED";
  const title = isCorrections ? "Corrections Requested" : "Registration Decision";
  const subject = `Registration Update — Sahasdhanavi System`;

  const body = `
    <p style="margin:0 0 14px;">
      Hello <strong>${escapeHtml(input.companyName)}</strong>,
    </p>
    <p style="margin:0 0 14px;">
      ${
        isCorrections
          ? "The Admin team has reviewed your registration and requires the following corrections before it can be approved:"
          : "After review by the Admin team, your registration request could not be approved at this time. Reason:"
      }
    </p>
    <div style="padding:16px;background:#19183B;border:1px solid #2A2A58;border-radius:12px;border-left:3px solid ${isCorrections ? "#F59E0B" : "#EF4444"};font-size:13px;color:#FFFFF0;white-space:pre-wrap;">
${escapeHtml(input.reason)}
    </div>
    <p style="margin:18px 0 0;color:#A1C2BD;font-size:12px;">
      Please contact the Admin team if you have any questions.
    </p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    html: baseTemplate(title, body),
  });
}

/* ───────────────────────────────────────────────────────────
   4. notifyAdminAdditionalRequest
   ─────────────────────────────────────────────────────────── */
interface AdditionalRequestNotification {
  contractorName: string;
  requestType: string;
  itemCount: number;
  requestId: string;
  baseUrl: string;
}

export async function notifyAdminAdditionalRequest(
  input: AdditionalRequestNotification,
) {
  const niceType = input.requestType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = `Additional Request — ${niceType} from ${input.contractorName}`;
  const adminUrl = `${input.baseUrl}/admin/additional-requests/${input.requestId}`;

  const body = `
    <p style="margin:0 0 14px;">
      <strong>${escapeHtml(input.contractorName)}</strong> has submitted an additional request and is awaiting review.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${statRow("Request Type", niceType)}
      ${statRow("Items in Request", String(input.itemCount))}
    </table>
  `;

  return sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject,
    html: baseTemplate(
      "New Additional Request",
      body,
      adminUrl,
      "Open in Admin Console",
    ),
  });
}

/* ───────────────────────────────────────────────────────────
   4b. notifyAdditionalRequestApproved
   ─────────────────────────────────────────────────────────── */
interface AdditionalRequestApprovalInput {
  to: string;
  companyName: string;
  requestType: string;
  itemCount: number;
  /** Optional context line shown after the headline. */
  followUp?: string;
  loginUrl?: string;
}

export async function notifyAdditionalRequestApproved(
  input: AdditionalRequestApprovalInput,
) {
  const niceType = input.requestType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = `Additional Request Approved — ${niceType}`;

  const body = `
    <p style="margin:0 0 14px;">
      Hello <strong>${escapeHtml(input.companyName)}</strong>,
    </p>
    <p style="margin:0 0 14px;">
      Good news — your additional <strong>${escapeHtml(niceType)}</strong> request
      has been approved and added to your active records.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
      ${statRow("Request Type", niceType)}
      ${statRow("Items Added", String(input.itemCount))}
    </table>
    ${
      input.followUp
        ? `<p style="margin:18px 0 0;color:#A1C2BD;font-size:12px;">
             ${escapeHtml(input.followUp)}
           </p>`
        : ""
    }
  `;

  return sendEmail({
    to: input.to,
    subject,
    html: baseTemplate(
      "Additional Request Approved",
      body,
      input.loginUrl,
      input.loginUrl ? "Open Contractor Console" : undefined,
    ),
  });
}

/* ───────────────────────────────────────────────────────────
   4c. notifyAdditionalRequestRejection — REJECTED or CORRECTIONS
   ─────────────────────────────────────────────────────────── */
interface AdditionalRequestRejectionInput {
  to: string;
  companyName: string;
  requestType: string;
  reason: string;
  mode: "REJECTED" | "CORRECTIONS_REQUESTED";
  loginUrl?: string;
}

export async function notifyAdditionalRequestRejection(
  input: AdditionalRequestRejectionInput,
) {
  const isCorrections = input.mode === "CORRECTIONS_REQUESTED";
  const niceType = input.requestType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const title = isCorrections ? "Corrections Requested" : "Additional Request Update";
  const subject = isCorrections
    ? `Corrections Requested — ${niceType}`
    : `Additional Request Update — ${niceType}`;

  const body = `
    <p style="margin:0 0 14px;">
      Hello <strong>${escapeHtml(input.companyName)}</strong>,
    </p>
    <p style="margin:0 0 14px;">
      ${
        isCorrections
          ? `The Admin team reviewed your additional <strong>${escapeHtml(niceType)}</strong> request and requires the following corrections before it can be approved:`
          : `After review by the Admin team, your additional <strong>${escapeHtml(niceType)}</strong> request could not be approved at this time. Reason:`
      }
    </p>
    <div style="padding:16px;background:#19183B;border:1px solid #2A2A58;border-radius:12px;border-left:3px solid ${isCorrections ? "#F59E0B" : "#EF4444"};font-size:13px;color:#FFFFF0;white-space:pre-wrap;">
${escapeHtml(input.reason || "No reason provided.")}
    </div>
    <p style="margin:18px 0 0;color:#A1C2BD;font-size:12px;">
      ${
        isCorrections
          ? "Please make the requested corrections and resubmit from your Contractor Console."
          : "If you have any questions, please contact the Admin team."
      }
    </p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    html: baseTemplate(
      title,
      body,
      input.loginUrl,
      input.loginUrl ? "Open Contractor Console" : undefined,
    ),
  });
}

/* ───────────────────────────────────────────────────────────
   5. notifyTwoFactorCode — Phase 3.5 contractor 2FA
   ─────────────────────────────────────────────────────────── */
interface TwoFactorEmailInput {
  to: string;
  code: string;
  companyName?: string;
  expiresInMinutes: number;
}

export async function notifyTwoFactorCode(input: TwoFactorEmailInput) {
  const subject = `Your verification code: ${input.code}`;

  const body = `
    <p style="margin:0 0 14px;">
      Hello${input.companyName ? ` <strong>${escapeHtml(input.companyName)}</strong>` : ""},
    </p>
    <p style="margin:0 0 14px;">
      Use the verification code below to finish signing in to the Sahasdhanavi Construction Security System.
    </p>

    <div style="margin:22px 0;text-align:center;">
      <div style="display:inline-block;padding:18px 28px;border-radius:14px;background:#19183B;border:1px solid #2A2A58;">
        <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:.22em;color:#7FC7D9;text-transform:uppercase;">
          Verification Code
        </div>
        <div style="margin-top:8px;font-family:'Courier New',monospace;font-size:36px;letter-spacing:.4em;color:#FFFFF0;font-weight:bold;">
          ${escapeHtml(input.code)}
        </div>
      </div>
    </div>

    <p style="margin:0 0 8px;color:#A1C2BD;font-size:12px;">
      This code expires in <strong>${input.expiresInMinutes} minutes</strong> and can be used once.
    </p>
    <p style="margin:0;color:#A1C2BD;font-size:12px;">
      If you didn't try to sign in, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    html: baseTemplate("Verify your sign-in", body),
  });
}
