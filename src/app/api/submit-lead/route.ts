import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { getRequestInfo } from "@/lib/requestInfo";
import {
  buildLeadEmail,
  DEFAULT_LEAD_FROM,
  LEAD_EMAIL_TO,
  type LeadEmailPayload,
} from "@/lib/leadEmail";
import { submitLeadSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hard ceiling on the request body, to reject junk submissions early. */
const MAX_BODY_BYTES = 64 * 1024;

const VALIDATION_MESSAGE =
  "Some of your details need attention. Please check the form and try again.";
const REJECTED_MESSAGE = "Your submission could not be processed. Please try again.";
const DELIVERY_MESSAGE =
  "We couldn't send your details just now. Please try again in a moment.";

const buildReferenceId = (date: Date): string => {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `LEAD-${stamp}-${randomBytes(3).toString("hex").toUpperCase()}`;
};

const json = (
  body: Record<string, unknown>,
  status: number,
  headers?: Record<string, string>
) => NextResponse.json(body, { status, headers });

const methodNotAllowed = () =>
  json(
    { success: false, message: "This endpoint only accepts POST requests." },
    405,
    { Allow: "POST" }
  );

/** Explicitly block non-POST verbs so the endpoint cannot be probed via GET. */
export async function GET(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function HEAD(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PATCH(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Reject oversized payloads before reading them into memory.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ success: false, message: REJECTED_MESSAGE }, 413);
  }

  // 2. Parse JSON defensively – malformed bodies are a client error, not a 500.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "Invalid request payload." }, 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return json({ success: false, message: "Invalid request payload." }, 400);
  }

  const raw = body as Record<string, unknown>;

  // 3. Honeypot: a real visitor never fills this hidden field, so treat any
  //    value as a bot and reject without sending or revealing why.
  const honeypot = raw.website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return json({ success: false, message: REJECTED_MESSAGE }, 400);
  }

  // 4. Re-run every validation rule server-side, plus the tracking fields.
  const parsed = submitLeadSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      if (!errors[field]) errors[field] = [];
      if (errors[field].length < 3) errors[field].push(issue.message);
    }

    return json(
      { success: false, message: VALIDATION_MESSAGE, errors },
      400
    );
  }

  const lead = parsed.data;

  // 5. Capture the visitor's public IP server-side from request headers only.
  //    Nothing the browser sent in the body is trusted for this.
  const { ipAddress, userAgent } = getRequestInfo(request.headers);
  const submittedAt = new Date();
  const referenceId = buildReferenceId(submittedAt);

  const emailPayload: LeadEmailPayload = {
    lead,
    referenceId,
    ipAddress,
    userAgent,
    submittedAt,
  };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    // No technical detail is returned to the visitor.
    console.error("[submit-lead] RESEND_API_KEY is not configured");
    return json({ success: false, message: DELIVERY_MESSAGE }, 503);
  }

  const { subject, html, text } = buildLeadEmail(emailPayload);
  const to = process.env.LEAD_EMAIL_TO?.trim() || LEAD_EMAIL_TO;
  const from = process.env.LEAD_FROM_EMAIL?.trim() || DEFAULT_LEAD_FROM;

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [to],
      replyTo: lead.email,
      subject,
      html,
      text,
    });

    if (result.error) {
      // Log the reference only – never the lead payload itself.
      console.error(
        `[submit-lead] delivery failed for ${referenceId}:`,
        result.error.name ?? "resend_error"
      );
      return json(
        { success: false, message: DELIVERY_MESSAGE, referenceId },
        502
      );
    }

    console.info(
      `[submit-lead] delivered ${referenceId} to ${to} (ip: ${ipAddress})`
    );

    return json(
      {
        success: true,
        message:
          "Thank you. Your details have been received and a member of our team will contact you shortly.",
        referenceId,
      },
      201
    );
  } catch (error) {
    console.error(
      `[submit-lead] unexpected error for ${referenceId}:`,
      error instanceof Error ? error.name : "unknown_error"
    );
    return json({ success: false, message: DELIVERY_MESSAGE, referenceId }, 502);
  }
}
