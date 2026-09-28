"use client";

import type { LeadFieldErrors } from "@/lib/validations";

export type SubmitLeadResult = {
  ok: boolean;
  message: string;
  referenceId?: string;
  fieldErrors?: LeadFieldErrors;
};

const NETWORK_ERROR_MESSAGE =
  "We couldn't submit your details. Please check your connection and try again.";

const UNKNOWN_ERROR_MESSAGE =
  "Something went wrong while submitting your details. Please try again.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const messages = value.filter((item): item is string => typeof item === "string");
  return messages.length > 0 ? messages : undefined;
};

const toFieldErrors = (value: unknown): LeadFieldErrors | undefined => {
  if (!isRecord(value)) return undefined;

  const result: LeadFieldErrors = {};
  let found = false;

  for (const [field, messages] of Object.entries(value)) {
    const parsed = toStringArray(messages);
    if (parsed) {
      result[field as keyof LeadFieldErrors] = parsed;
      found = true;
    }
  }

  return found ? result : undefined;
};

/**
 * Posts the complete form state to the lead endpoint.
 *
 * The visitor's IP address is deliberately never included here: it is captured
 * server-side from request headers so it cannot be spoofed by the browser.
 */
export const submitLeadRequest = async (
  payload: Record<string, unknown>
): Promise<SubmitLeadResult> => {
  try {
    const response = await fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const data = isRecord(body) ? body : {};
    const serverMessage =
      typeof data.message === "string" ? data.message : undefined;
    const referenceId =
      typeof data.referenceId === "string" ? data.referenceId : undefined;
    const fieldErrors = toFieldErrors(data.errors);

    if (response.ok) {
      return {
        ok: true,
        message: serverMessage ?? "Your details have been submitted successfully.",
        referenceId,
      };
    }

    return {
      ok: false,
      message: serverMessage ?? UNKNOWN_ERROR_MESSAGE,
      referenceId,
      fieldErrors,
    };
  } catch {
    return { ok: false, message: NETWORK_ERROR_MESSAGE };
  }
};
