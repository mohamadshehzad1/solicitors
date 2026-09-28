import type { SubmitLeadInput } from "@/lib/validations";

/** Fixed recipient for every housing disrepair lead. */
export const LEAD_EMAIL_TO = "info@thecompensationpeopleltd.co.uk";

/** Default verified sender. Overridable with LEAD_FROM_EMAIL on Vercel. */
export const DEFAULT_LEAD_FROM = `Website Leads <${LEAD_EMAIL_TO}>`;

export type LeadEmailPayload = {
  lead: SubmitLeadInput;
  referenceId: string;
  /** Captured server-side from request headers. */
  ipAddress: string;
  userAgent: string;
  /** Server-generated submission timestamp. */
  submittedAt: Date;
};

export type LeadEmail = {
  subject: string;
  html: string;
  text: string;
};

const BRAND = {
  navy: "#0f172a",
  navySoft: "#334e68",
  gold: "#f97316",
  goldSoft: "#fff7ed",
  page: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  success: "#15803d",
} as const;

const NOT_PROVIDED = "Not provided";

const TENANCY_LABELS: Record<string, string> = {
  "council-tenant": "Council",
  "housing-association": "Housing Association",
  "private-tenant": "Private Landlord",
  homeowner: "Homeowner / Owner-occupier",
};

const REPORTED_LABELS: Record<string, string> = {
  "yes-over-21-days": "Yes, over 21 days ago",
  "yes-recently": "Yes, recently",
  no: "No, not yet",
};

/** Covers the issue ids used by both the eligibility form and the quote form. */
const ISSUE_LABELS: Record<string, string> = {
  "mould-damp": "Damp & Toxic Black Mould",
  "water-leaks": "Structural Damage & Leaks",
  "broken-heating": "Broken Heating Systems / Boilers",
  "pest-infestation": "Pest & Rodent Infestations",
  "damp-mould": "Damp & Mould",
  heating: "Broken Heating / Boiler",
  structural: "Structural Damage",
  pest: "Pest Infestation",
  leaks: "Water Leaks / Plumbing",
};

const UTM_LABELS: Record<string, string> = {
  utm_source: "UTM Source",
  utm_medium: "UTM Medium",
  utm_campaign: "UTM Campaign",
  utm_term: "UTM Term",
  utm_content: "UTM Content",
  gclid: "Google Click ID (gclid)",
  fbclid: "Meta Click ID (fbclid)",
};

/** Escapes every character that could break out of HTML text or an attribute. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Escapes, then converts newlines to <br /> for multi-line answers. */
const escapeMultiline = (value: string): string =>
  escapeHtml(value).replace(/\r\n|\r|\n/g, "<br />");

const humaniseKey = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const isBlank = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "");

const formatPlainValue = (value: unknown): string => {
  if (isBlank(value)) return NOT_PROVIDED;
  if (Array.isArray(value)) {
    const items = value.filter((item) => !isBlank(item)).map(String);
    return items.length > 0 ? items.join(", ") : NOT_PROVIDED;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const formatDate = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "full",
      timeStyle: "medium",
      timeZone: "Europe/London",
    }).format(date);
  } catch {
    return date.toISOString();
  }
};

const formatDateShort = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/London",
    }).format(date);
  } catch {
    return date.toISOString();
  }
};

const labelFor = (labels: Record<string, string>, key: string): string =>
  labels[key] ?? humaniseKey(key);

/**
 * Strips control characters (including CR/LF) and trims a value destined for
 * an email header such as the subject line.
 */
const sanitiseHeaderValue = (value: string, maxLength = 120): string => {
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > maxLength
    ? `${cleaned.slice(0, maxLength - 1)}…`
    : cleaned;
};

type Row = { label: string; value: string; multiline?: boolean; href?: string };

const row = (label: string, value: unknown, href?: string): Row => ({
  label,
  value: formatPlainValue(value),
  href,
});

const issueLabels = (issues: string[]): string[] =>
  issues.map((issue) => labelFor(ISSUE_LABELS, issue));

type Section = {
  title: string;
  step?: number;
  rows: Row[];
  /** Bulleted list rendered under the section title (multi-select answers). */
  bullets?: string[];
  note?: string;
};

const applicantName = (lead: SubmitLeadInput): string => {
  const first = lead.firstName?.trim() ?? "";
  const last = lead.lastName?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? full : "Unknown applicant";
};

const buildSections = (lead: SubmitLeadInput): Section[] => [
  {
    title: "Step 1 – Who do you rent from?",
    step: 1,
    rows: [
      {
        label: "Landlord / tenancy type",
        value: lead.tenancyType
          ? labelFor(TENANCY_LABELS, lead.tenancyType)
          : NOT_PROVIDED,
      },
    ],
  },
  {
    title: "Step 2 – What disrepair issues are you experiencing?",
    step: 2,
    rows: [
      {
        label: "Number of issues selected",
        value: String(lead.disrepairIssues?.length ?? 0),
      },
    ],
    bullets: issueLabels(lead.disrepairIssues ?? []),
  },
  {
    title: "Step 3 – Have you reported this to your landlord?",
    step: 3,
    rows: [
      {
        label: "Reported to landlord",
        value: lead.issueReported
          ? labelFor(REPORTED_LABELS, lead.issueReported)
          : NOT_PROVIDED,
      },
    ],
  },
  {
    title: "Step 4 – Your details",
    step: 4,
    rows: [
      row("First name", lead.firstName),
      row("Last name", lead.lastName),
      row("Full name", applicantName(lead)),
      row("Telephone", lead.phone, `tel:${formatPlainValue(lead.phone)}`),
      row("Email address", lead.email, `mailto:${formatPlainValue(lead.email)}`),
    ],
  },
  {
    title: "Property details",
    rows: [
      row("Property address", lead.address),
      { label: "Description of the disrepair", value: formatPlainValue(lead.description), multiline: true },
    ],
  },
  {
    title: "Consent",
    rows: [
      {
        label: "Consent to process data",
        value: lead.gdprConsent ? "Yes – consent given" : NOT_PROVIDED,
      },
    ],
  },
];

const renderValue = (value: Row): string => {
  const escaped = value.multiline
    ? escapeMultiline(value.value)
    : escapeHtml(value.value);

  if (value.href && value.value !== NOT_PROVIDED) {
    const href = escapeHtml(value.href);
    return `<a href="${href}" style="color:${BRAND.navySoft};font-weight:600;text-decoration:underline;">${escaped}</a>`;
  }

  return escaped;
};

const renderRows = (rows: Row[]): string =>
  rows
    .map(
      (value, index) => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:13px;width:42%;vertical-align:top;">${escapeHtml(
                value.label
              )}</td>
              <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:${
                index === 0 ? "600" : "400"
              };vertical-align:top;">${renderValue(value)}</td>
            </tr>`
    )
    .join("");

const renderSection = (section: Section): string => {
  const heading = section.step
    ? `<span style="display:inline-block;min-width:20px;height:20px;line-height:20px;text-align:center;background:${BRAND.gold};color:#ffffff;border-radius:10px;font-size:11px;font-weight:700;margin-right:8px;">${section.step}</span>`
    : "";

  const bullets = section.bullets?.length
    ? `<ul style="margin:6px 0 0;padding:0 0 0 18px;">
                ${section.bullets
                  .map(
                    (item) =>
                      `<li style="padding:3px 0;color:${BRAND.text};font-size:14px;">${escapeHtml(
                        item
                      )}</li>`
                  )
                  .join("")}
              </ul>`
    : "";

  const note = section.note
    ? `<p style="margin:10px 0 0;color:${BRAND.muted};font-size:12px;line-height:18px;">${escapeHtml(
        section.note
      )}</p>`
    : "";

  return `
          <tr>
            <td style="padding:0 0 16px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;border-collapse:separate;">
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px solid ${BRAND.border};background:${BRAND.goldSoft};border-radius:12px 12px 0 0;">
                    <h2 style="margin:0;color:${BRAND.navy};font-size:15px;font-weight:700;line-height:22px;">${heading}${escapeHtml(
                      section.title
                    )}</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 6px 10px 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      ${renderRows(section.rows)}
                    </table>
                    ${bullets}
                    ${note}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
};

const buildTechnicalSection = (payload: LeadEmailPayload): Section => {
  const { lead, referenceId, ipAddress, userAgent, submittedAt } = payload;

  const rows: Row[] = [
    row("Reference", referenceId),
    { label: "Submitted (server time)", value: formatDate(submittedAt) },
    { label: "Public IP address", value: ipAddress },
    row("Form source", lead.formSource),
    row("Page URL", lead.pageUrl),
    row("Landing page URL", lead.landingPage),
    row("Referrer", lead.referrer),
  ];

  for (const [key, label] of Object.entries(UTM_LABELS)) {
    const value = lead[key as keyof SubmitLeadInput];
    if (!isBlank(value)) {
      rows.push({ label, value: formatPlainValue(value) });
    }
  }

  rows.push({ label: "User agent", value: userAgent });

  return {
    title: "Submission & tracking details",
    rows,
    note: "The public IP address above is captured server-side from the request headers and cannot be supplied or altered by the visitor's browser.",
  };
};

const renderSummary = (payload: LeadEmailPayload): string => {
  const { lead, referenceId, submittedAt } = payload;
  const issues = issueLabels(lead.disrepairIssues ?? []);

  const summaryItem = (label: string, value: string): string => `
                    <td style="padding:6px 10px 6px 0;vertical-align:top;white-space:nowrap;">
                      <span style="display:block;color:${BRAND.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(
                        label
                      )}</span>
                      <span style="display:block;color:${BRAND.text};font-size:14px;font-weight:600;">${escapeHtml(
                        value
                      )}</span>
                    </td>`;

  return `
          <tr>
            <td style="padding:0 0 16px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.goldSoft};border:1px solid ${BRAND.gold};border-radius:12px;border-collapse:separate;">
                <tr>
                  <td style="padding:18px;">
                    <p style="margin:0 0 4px 0;color:${BRAND.gold};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;">Applicant</p>
                    <p style="margin:0 0 12px 0;color:${BRAND.navy};font-size:22px;font-weight:800;line-height:28px;">${escapeHtml(
                      applicantName(lead)
                    )}</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        ${summaryItem("Telephone", formatPlainValue(lead.phone))}
                        ${summaryItem("Email", formatPlainValue(lead.email))}
                        ${summaryItem("Received", formatDateShort(submittedAt))}
                      </tr>
                      <tr>
                        ${summaryItem("Landlord", lead.tenancyType ? labelFor(TENANCY_LABELS, lead.tenancyType) : NOT_PROVIDED)}
                        ${summaryItem("Reference", referenceId)}
                        ${summaryItem("Issues", issues.length > 0 ? issues.join(", ") : NOT_PROVIDED)}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
};

const renderPropertyLine = (lead: SubmitLeadInput): string => {
  const address = formatPlainValue(lead.address);
  if (address === NOT_PROVIDED) return "";

  return `
          <tr>
            <td style="padding:0 0 16px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;border-collapse:separate;">
                <tr>
                  <td style="padding:16px 18px;">
                    <h2 style="margin:0 0 6px 0;color:${BRAND.navy};font-size:15px;font-weight:700;">Property</h2>
                    <p style="margin:0;color:${BRAND.text};font-size:14px;line-height:22px;">${escapeHtml(
                      address
                    )}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
};

export const buildLeadEmail = (payload: LeadEmailPayload): LeadEmail => {
  const { lead } = payload;
  const sections = [...buildSections(lead), buildTechnicalSection(payload)];
  const subject = `New Housing Disrepair Lead - ${sanitiseHeaderValue(
    applicantName(lead)
  )}`;

  const html = `<!DOCTYPE html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};width:100%;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;">
            <tr>
              <td style="background:${BRAND.navy};border-radius:12px 12px 0 0;padding:24px;">
                <p style="margin:0;color:${BRAND.gold};font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">The Compensation People</p>
                <h1 style="margin:8px 0 6px 0;color:#ffffff;font-size:24px;font-weight:800;line-height:32px;">New Housing Disrepair Lead</h1>
                <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:20px;">Submitted ${escapeHtml(
                  formatDate(payload.submittedAt)
                )} &bull; Reference ${escapeHtml(payload.referenceId)}</p>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.page};padding:16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${renderSummary(payload)}
                  ${renderPropertyLine(lead)}
                  ${sections.map(renderSection).join("")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.navy};border-radius:0 0 12px 12px;padding:18px 24px;">
                <p style="margin:0 0 4px 0;color:#ffffff;font-size:12px;font-weight:700;">Automated website enquiry</p>
                <p style="margin:0;color:#94a3b8;font-size:11px;line-height:17px;">This email was generated by the housing disrepair form on thecompensationpeopleltd.co.uk. Please do not reply to the automated address &ndash; use the applicant details above. Values shown as &ldquo;${escapeHtml(
                  NOT_PROVIDED
                )}&rdquo; were left blank by the applicant.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines: string[] = [
    "NEW HOUSING DISREPAIR LEAD",
    "The Compensation People",
    "",
    `Applicant: ${applicantName(lead)}`,
    `Telephone: ${formatPlainValue(lead.phone)}`,
    `Email: ${formatPlainValue(lead.email)}`,
    `Reference: ${payload.referenceId}`,
    `Submitted: ${formatDate(payload.submittedAt)}`,
    "",
  ];

  for (const section of sections) {
    textLines.push(`== ${section.title} ==`);
    for (const value of section.rows) {
      textLines.push(`${value.label}: ${value.value}`);
    }
    if (section.bullets?.length) {
      for (const bullet of section.bullets) textLines.push(`  - ${bullet}`);
    }
    textLines.push("");
  }

  textLines.push(
    "Automated website enquiry. Values shown as \"Not provided\" were left blank by the applicant."
  );

  return {
    subject,
    html,
    text: textLines.join("\n").replace(/\n{3,}/g, "\n\n"),
  };
};
