import {
  DELETE,
  GET,
  HEAD,
  PATCH,
  POST,
  PUT,
} from "@/app/api/submit-lead/route";

/**
 * Legacy path kept so any existing callers keep working.
 *
 * The original implementation only logged the lead to the server console. It
 * now delegates to the single, shared lead handler, so there is a single place
 * that validates the payload, captures the visitor IP server-side and sends
 * the email.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { POST, GET, HEAD, PUT, PATCH, DELETE };
