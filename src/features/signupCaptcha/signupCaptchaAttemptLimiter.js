const STORAGE_KEY_PREFIX = "signup_captcha_failures_v1_";
const IP_SESSION_KEY = "signup_captcha_client_ip_v1";

export const SIGNUP_CAPTCHA_MAX_ATTEMPTS = 5;
/** Lockout duration after max failed attempts (45 minutes). */
export const SIGNUP_CAPTCHA_LOCKOUT_MS = 45 * 60 * 1000;

async function getPublicIp() {
  if (typeof window === "undefined") return "local";
  try {
    const cached = sessionStorage.getItem(IP_SESSION_KEY);
    if (cached) return cached;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: ctrl.signal,
    });
    window.clearTimeout(t);
    if (!res.ok) throw new Error("ip");
    const data = await res.json();
    const ip = typeof data?.ip === "string" && data.ip ? data.ip : "local";
    sessionStorage.setItem(IP_SESSION_KEY, ip);
    return ip;
  } catch {
    return "local";
  }
}

function storageKey(ip) {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(ip)}`;
}

function readRecordRaw(ip) {
  try {
    const raw = localStorage.getItem(storageKey(ip));
    if (!raw) return { failures: 0, blockedUntil: null };
    const asNum = parseInt(raw, 10);
    if (Number.isFinite(asNum) && raw === String(asNum)) {
      return {
        failures: Math.max(0, asNum),
        blockedUntil: null,
      };
    }
    const o = JSON.parse(raw);
    if (o && typeof o.failures === "number") {
      return {
        failures: Math.max(0, o.failures),
        blockedUntil:
          typeof o.blockedUntil === "number" ? o.blockedUntil : null,
      };
    }
  } catch {
    /* ignore */
  }
  return { failures: 0, blockedUntil: null };
}

function writeRecord(ip, rec) {
  try {
    localStorage.setItem(storageKey(ip), JSON.stringify(rec));
  } catch {
    /* quota / private mode */
  }
}

/**
 * Expires lockout if past blockedUntil; migrates legacy blocked state with no timestamp.
 */
function readRecord(ip) {
  let rec = readRecordRaw(ip);
  const now = Date.now();

  if (rec.failures >= SIGNUP_CAPTCHA_MAX_ATTEMPTS) {
    if (rec.blockedUntil != null) {
      if (now >= rec.blockedUntil) {
        rec = { failures: 0, blockedUntil: null };
        writeRecord(ip, rec);
      }
    } else {
      rec = {
        failures: rec.failures,
        blockedUntil: now + SIGNUP_CAPTCHA_LOCKOUT_MS,
      };
      writeRecord(ip, rec);
    }
  }

  return rec;
}

function isBlocked(rec) {
  const now = Date.now();
  return (
    rec.failures >= SIGNUP_CAPTCHA_MAX_ATTEMPTS &&
    rec.blockedUntil != null &&
    now < rec.blockedUntil
  );
}

/**
 * Formats remaining lockout time as M:SS (e.g. 45:00 … 0:01).
 */
export function formatCaptchaLockoutCountdown(remainingMs) {
  if (remainingMs <= 0) return "0:00";
  const totalSec = Math.ceil(remainingMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Resolves client IP (best effort) and returns failed-attempt state for that key.
 */
export async function getSignupCaptchaAttemptState() {
  const ip = await getPublicIp();
  const rec = readRecord(ip);
  const blocked = isBlocked(rec);
  const unlockAtMs =
    blocked && rec.blockedUntil != null ? rec.blockedUntil : null;
  const remainingMs =
    blocked && rec.blockedUntil != null
      ? Math.max(0, rec.blockedUntil - Date.now())
      : 0;

  return {
    ip,
    failedAttempts: rec.failures,
    remaining: blocked
      ? 0
      : Math.max(0, SIGNUP_CAPTCHA_MAX_ATTEMPTS - rec.failures),
    blocked,
    unlockAtMs,
    remainingMs,
  };
}

/**
 * Call after a failed captcha check. Increments count for the current IP key.
 */
export async function recordSignupCaptchaFailure() {
  const ip = await getPublicIp();
  const rec = readRecord(ip);
  const next = rec.failures + 1;
  let blockedUntil = null;
  if (next >= SIGNUP_CAPTCHA_MAX_ATTEMPTS) {
    blockedUntil = Date.now() + SIGNUP_CAPTCHA_LOCKOUT_MS;
  }
  const nextRec = { failures: next, blockedUntil };
  writeRecord(ip, nextRec);

  const blocked = isBlocked(nextRec);
  const remainingMs =
    blocked && nextRec.blockedUntil != null
      ? Math.max(0, nextRec.blockedUntil - Date.now())
      : 0;

  return {
    ip,
    failedAttempts: next,
    remaining: blocked
      ? 0
      : Math.max(0, SIGNUP_CAPTCHA_MAX_ATTEMPTS - next),
    blocked,
    unlockAtMs: blocked ? nextRec.blockedUntil : null,
    remainingMs,
  };
}
