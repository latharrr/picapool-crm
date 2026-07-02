/**
 * Dropdown option lists transcribed from the Picapool research coding
 * dictionary (Taxonomy + FilterLists sheets in
 * "Copy of Picapool_Product_Filter_Panel.xlsx"). These drive the interview
 * console's <Select> options as a soft constraint — the underlying schema
 * validates these fields as plain non-empty strings, not a hard enum, so
 * historical data that predates or deviates slightly from this list still
 * imports and displays correctly. See docs comment in
 * src/lib/sheets/schema/research.ts for why.
 */

export const CALL_STATUS_OPTIONS = [
  { value: "pending", label: "Pending (not yet called)" },
  { value: "completed", label: "Completed" },
  { value: "call_later", label: "Call Later" },
  { value: "refused", label: "Refused" },
  { value: "not_answered", label: "Not Answered" },
  { value: "wrong_number", label: "Wrong Number" },
] as const;

export const JTBD_OPTIONS = [
  "Flat Search",
  "Flatmate Search",
  "Flat + Flatmate",
  "CUET Guidance",
  "Group Buying",
  "Networking",
  "Internship / Referred",
  "Ask Around",
  "Other",
];

export const ACQUISITION_SOURCE_OPTIONS = [
  "WhatsApp",
  "Instagram",
  "College Group",
  "Friend / Word of Mouth",
  "Udmohya (Internship)",
  "DRC Stall",
  "YouTube Ads",
  "Telegram",
  "App Store",
  "Call by Team",
  "Other",
];

export const PERCEPTION_OPTIONS = [
  "Flat / PG App",
  "Flatmate App",
  "Coordination Platform",
  "Group Buying App",
  "CUET Guidance App",
  "Student Accomodation Platform",
  "Just Another App",
  "Unclear / Confused",
];

export const FEATURE_AWARENESS_OPTIONS = [
  "Flatmates Only",
  "Cabs Only",
  "Group Buying Only",
  "Ask Around Only",
  "Flatmates + AskAround",
  "Flatmates + Cabs",
  "Flatmates + GroupBuy",
  "All Features",
  "None Aware",
];

export const YES_NO_PARTIALLY_OPTIONS = ["Yes", "No", "Partially"];

export const COORDINATION_SUCCESS_OPTIONS = [
  "Success — Found & Coordinated",
  "Partial — Connected but No Follow-Through",
  "Failure — No Match Found",
  "N/A — Not Tried",
];

export const MARKETPLACE_CONFIDENCE_OPTIONS = [
  "High — Trusted Listings",
  "Medium — Some Concerns",
  "Low — Suspicious of Quality",
  "Very Low — Bot / Spam Concerns",
];

export const CROSS_JTBD_RETURN_OPTIONS = [
  "Yes — Explicitly Stated",
  "Maybe — Open to It",
  "No — Single Use Only",
  "N/A — Not Asked",
];

export const BIGGEST_FRICTION_OPTIONS = [
  "App Performance (Lag)",
  "Budget Mismatch",
  "Chat / Moderation Issues",
  "Complicated Onboarding / KYC",
  "Irrelevant Matches",
  "Other",
];

export const MISSING_CAPABILITY_OPTIONS = [
  "Chat Moderation",
  "Google Sign-In",
  "More Flat Listings",
  "More Flatmate Profiles",
  "None",
  "Other",
];

export const SCORE_LABELS: Record<number, string> = {
  5: "5 — Strongly Positive",
  4: "4 — Positive",
  3: "3 — Neutral",
  2: "2 — Negative",
  1: "1 — Strongly Negative",
};
