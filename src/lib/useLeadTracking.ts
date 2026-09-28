"use client";

import { useState } from "react";
import { collectLeadTracking, type LeadTracking } from "@/lib/leadTracking";

/**
 * Returns the attribution data to send with a lead submission.
 *
 * Read once per mount from sessionStorage (populated by the head bootstrap
 * script) plus the current URL, so the visitor can never fabricate it as a
 * required field. Only the caller's own form answers are validated server-side;
 * tracking data is informational.
 */
export const useLeadTracking = (): LeadTracking => {
  const [tracking] = useState<LeadTracking>(() => collectLeadTracking());
  return tracking;
};
