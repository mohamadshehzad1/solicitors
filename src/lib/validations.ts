import { z } from "zod";

export const TENANCY_TYPES = [
  "council-tenant",
  "housing-association",
  "private-tenant",
  "homeowner",
] as const;

export const ISSUE_REPORTED_VALUES = [
  "yes-over-21-days",
  "yes-recently",
  "no",
] as const;

export type TenancyType = (typeof TENANCY_TYPES)[number];

export const leadFormSchema = z.object({
  tenancyType: z.enum(
    ["council-tenant", "housing-association", "private-tenant", "homeowner"],
    {
      required_error: "Please select your tenancy type",
    }
  ),
  disrepairIssues: z
    .array(z.string())
    .min(1, "Please select at least one disrepair issue"),
  issueReported: z.enum(["yes-over-21-days", "yes-recently", "no"], {
    required_error: "Please tell us if this has been reported",
  }),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  phone: z
    .string()
    .min(10, "Please enter a valid UK phone number")
    .max(15, "Please enter a valid UK phone number")
    .regex(
      /^(\+44|0)\d{10}$/,
      "Please enter a valid UK phone number (e.g., 07700900000)"
    ),
  email: z.string().email("Please enter a valid email address"),
  address: z
    .string()
    .min(5, "Please enter your full address")
    .max(200, "Address must be less than 200 characters"),
  gdprConsent: z.literal(true, {
    errorMap: () => ({
      message: "You must consent to our privacy policy to proceed",
    }),
  }),
  // Hidden anti-spam honeypot. Must stay empty on a genuine submission.
  website: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

/** Strips the formatting a user may type into a UK phone number. */
export const normalisePhone = (value: string): string =>
  value.replace(/[\s()\-.]/g, "");

const isUkPhoneNumber = (value: string): boolean =>
  /^(\+44|44|0)\d{9,10}$/.test(normalisePhone(value));

/**
 * Lightweight UTM / attribution fields. All optional: the forms still work
 * for visitors who arrive with no tracking parameters at all.
 */
export const leadTrackingSchema = {
  utm_source: z.string().trim().max(200).optional(),
  utm_medium: z.string().trim().max(200).optional(),
  utm_campaign: z.string().trim().max(200).optional(),
  utm_term: z.string().trim().max(200).optional(),
  utm_content: z.string().trim().max(200).optional(),
  gclid: z.string().trim().max(200).optional(),
  fbclid: z.string().trim().max(200).optional(),
  pageUrl: z.string().trim().max(500).optional(),
  landingPage: z.string().trim().max(500).optional(),
  referrer: z.string().trim().max(500).optional(),
  formSource: z.string().trim().max(120).optional(),
};

/**
 * Canonical server-side schema for POST /api/submit-lead.
 *
 * It is a superset of the two existing browser forms (the homepage eligibility
 * form and the quote form), so every field either form already collects is
 * preserved. Browser-only rules are re-checked here so the endpoint can never
 * be bypassed by posting directly to it.
 */
export const submitLeadSchema = z.object({
  tenancyType: z.enum(TENANCY_TYPES, {
    required_error: "Please select your tenancy type",
  }),
  disrepairIssues: z
    .array(z.string().trim().min(1).max(60))
    .min(1, "Please select at least one disrepair issue")
    .max(20, "Too many disrepair issues selected"),
  issueReported: z.enum(ISSUE_REPORTED_VALUES, {
    required_error: "Please tell us if this has been reported",
  }),
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(60, "First name must be less than 60 characters"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(60, "Last name must be less than 60 characters"),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid UK phone number")
    .max(24, "Please enter a valid UK phone number")
    .refine(isUkPhoneNumber, "Please enter a valid UK phone number"),
  email: z
    .string()
    .trim()
    .max(254, "Please enter a valid email address")
    .email("Please enter a valid email address"),
  address: z
    .string()
    .trim()
    .min(5, "Please enter your full address")
    .max(200, "Address must be less than 200 characters"),
  // Only collected by the quote form, so it stays optional here.
  description: z.string().trim().max(2000).optional(),
  gdprConsent: z.literal(true, {
    errorMap: () => ({
      message: "You must consent to our privacy policy to proceed",
    }),
  }),
  website: z.string().max(200).optional(),
  ...leadTrackingSchema,
});

export type SubmitLeadInput = z.infer<typeof submitLeadSchema>;

export type LeadFieldErrors = Partial<
  Record<keyof SubmitLeadInput, string[]>
>;
