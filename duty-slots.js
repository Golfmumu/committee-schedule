// Dates (ISO, Gregorian) and hours open for sign-up.
// Edit here to change the sheet — the Firestore rules accept any date
// string and any hour in HOURS, so no other file needs to change.
export const DATES = [
  "2026-09-28",
  "2026-09-29",
  "2026-09-30",
  "2026-10-01",
  "2026-10-02",
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-10",
  "2026-10-29",
  "2026-10-30",
];

export const HOURS = [9, 10, 11, 13, 14, 15];

export const SEATS_PER_SLOT = 2;

export function hourLabel(h) {
  return `${h}.00 - ${h + 1}.00`;
}

const WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

// "2026-09-24" -> { label: "24/9/2569", weekday: "พฤหัสบดี" }
export function formatDutyDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { label: `${d}/${m}/${y + 543}`, weekday };
}
