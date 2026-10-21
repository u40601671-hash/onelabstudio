// Small time and id helpers shared by the video editor (pure functions, no browser APIs).

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

let counter = 0;
export const uid = (prefix = "id") => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function parts(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000)); // round once on the total so .9996 carries correctly
  return [Math.floor(totalMs / 3600000), Math.floor(totalMs / 60000) % 60, Math.floor(totalMs / 1000) % 60, totalMs % 1000];
}
const p2 = (n) => String(n).padStart(2, "0");

export function srtTime(seconds) {
  const [h, m, s, ms] = parts(seconds);
  return `${p2(h)}:${p2(m)}:${p2(s)},${String(ms).padStart(3, "0")}`;
}
export const vttTime = (seconds) => srtTime(seconds).replace(",", ".");

/** 1:05 or 1:02:05 */
export function clock(seconds) {
  const [h, m, s] = parts(seconds);
  return h ? `${h}:${p2(m)}:${p2(s)}` : `${m}:${p2(s)}`;
}
/** 1:05.3 (tenths) for the editor's time fields */
export function clockTenths(seconds) {
  const t = Math.max(0, seconds);
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

/** Parse "00:01:02,500", "01:02.5", "62.5" or a number. Returns null when it is not a time. */
export function parseTimestamp(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const v = value.trim().replace(",", ".");
  if (!v) return null;
  const parts = v.split(":");
  if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  return nums[0];
}

export const round3 = (n) => Math.round(n * 1000) / 1000;
