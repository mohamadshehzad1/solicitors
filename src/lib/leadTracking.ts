/**
 * Lightweight first-party attribution capture.
 *
 * A tiny inline script in the document head stores the first UTM/click
 * parameters of the session in sessionStorage, so attribution survives
 * navigation from a landing page to the multi-step claim form. It renders
 * nothing and changes no part of the visual design.
 *
 * Safe to import from both server and client code: all browser access is
 * guarded at call time.
 */

export const LEAD_TRACKING_STORAGE_KEY = "tcp_lead_tracking";

export const TRACKING_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

export type LeadTrackingParam = (typeof TRACKING_PARAM_KEYS)[number];

export type LeadTracking = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  /** Page the form was submitted from. */
  pageUrl?: string;
  /** First page of the session, where any UTM parameters arrived. */
  landingPage?: string;
  referrer?: string;
};

type StoredTracking = LeadTracking & { capturedAt?: string };

const MAX_LENGTH = 500;

const truncate = (value: string): string =>
  value.length > MAX_LENGTH ? value.slice(0, MAX_LENGTH) : value;

const readParams = (search: string): Partial<LeadTracking> => {
  if (typeof URLSearchParams === "undefined") return {};

  const params = new URLSearchParams(search);
  const result: Partial<LeadTracking> = {};

  for (const key of TRACKING_PARAM_KEYS) {
    const value = params.get(key);
    if (value) result[key] = truncate(value);
  }

  return result;
};

const readStored = (): StoredTracking => {
  try {
    const raw = window.sessionStorage.getItem(LEAD_TRACKING_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as StoredTracking;
  } catch {
    return {};
  }
};

/**
 * Merges live URL parameters with anything already stored for the session.
 * Always returns a plain object, so it is safe to JSON.stringify.
 */
export const collectLeadTracking = (): LeadTracking => {
  if (typeof window === "undefined") return {};

  try {
    const stored = readStored();
    const live = readParams(window.location.search);

    const merged: LeadTracking = { ...stored };
    for (const [key, value] of Object.entries(live)) {
      if (value) merged[key as keyof LeadTracking] = value;
    }

    merged.pageUrl = truncate(window.location.href);
    if (!merged.landingPage) {
      merged.landingPage = truncate(window.location.href);
    }
    if (!merged.referrer) {
      const referrer = document.referrer;
      if (referrer) merged.referrer = truncate(referrer);
    }

    return merged;
  } catch {
    return {};
  }
};

/**
 * Inlined into <head> by the root layout. Static source only – no user data is
 * interpolated into it.
 */
export const LEAD_TRACKING_BOOTSTRAP_SCRIPT = `(function(){try{var K=${JSON.stringify(
  LEAD_TRACKING_STORAGE_KEY
)},KEYS=${JSON.stringify(TRACKING_PARAM_KEYS)},S=window.sessionStorage,prev={};try{prev=JSON.parse(S.getItem(K)||"{}")||{};}catch(e){}if(!prev||typeof prev!=="object"||Array.isArray(prev))prev={};var next={},q=new URLSearchParams(window.location.search);for(var i=0;i<KEYS.length;i++){var v=q.get(KEYS[i]);if(v){next[KEYS[i]]=v;}else if(prev[KEYS[i]]){next[KEYS[i]]=prev[KEYS[i]];}}if(!prev.landingPage)next.landingPage=window.location.href;if(!prev.referrer&&document.referrer)next.referrer=document.referrer;next.capturedAt=new Date().toISOString();S.setItem(K,JSON.stringify(next));}catch(e){}})();`;
