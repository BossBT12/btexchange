/**
 * Formats pair label for display: -USD -> -USDT (e.g. BTC-USD -> BTC-USDT)
 * @param {string} pair - Trading pair string (e.g. BTC-USD)
 * @returns {string} Display label (e.g. BTC-USDT)
 */
export const formatPairForDisplay = (pair) => {
  if (!pair || typeof pair !== "string") return pair ?? "";
  return pair.replace(/-USD$/i, "USDT");
};

// Display-only currencies (by language/locale). API always uses USDT.
// Rate = display units per 1 USDT (e.g. 1 USDT = 95 INR).
export const DISPLAY_CURRENCIES = [
  { code: "USDT", label: "USDT" },   // en
  { code: "USD", label: "US dollar" },     // en  
  { code: "MYR", label: "Ringgit malaysia " },
  { code: "IDR", label: "Indonesian rupiah" },
  { code: "CNY", label: "Chinese yuan" },     // zh
  { code: "AUD", label: "Australian dollar" },
  { code: "THB", label: "Thailand baht" },
  { code: "INR", label: "Indian rupee" },     // hi
  { code: "PHP", label: "Philippine peso" },
  { code: "JPY", label: "Japanese yen" },
  { code: "KRW", label: "Korean won" },
  { code: "RUB", label: "Russian ruble" },
  { code: "EUR", label: "Spanish" },
  { code: "EUR", label: "France" },
  { code: "VND", label: "Vietnam" },
];

const CURRENCY_TO_USDT_RATES = {
  USDT: 1,
  INR: 95,
  MYR: 4.5,
  IDR: 15000,
  CNY: 7.24,
  AUD: 1.5,
  THB: 35,
  PHP: 55,
  JPY: 150,
  KRW: 1300,     // ko
  RUB: 100,
  EUR: 0.92,     // fr
  VND: 23000,    // vi
};

/** Display units per 1 USDT for a currency (for client-side display only). */
export const getCurrencyDisplayRate = (currency = "USDT") =>
  CURRENCY_TO_USDT_RATES[currency] ?? 1;

/**
 * Formats currency for display (value is in USDT from API).
 * @param {number} value - Value in USDT
 * @param {string} currency - Display currency code (e.g. USDT, INR, EUR)
 * @returns {object} { mainValue, displayValue, currency }
 */
export const formatCurrencyForDisplay = (value, currency = "USDT") => {
  const num = Number(value);
  const rate = getCurrencyDisplayRate(currency);
  const displayNum = num * rate;
  return {
    mainValue: displayNum.toFixed(2),
    displayValue: `${displayNum.toFixed(2)} ${currency}`,
    currency,
  };
};

/**
 * Converts display-currency value to USDT for API. API always receives USDT.
 */
export const formatCurrencyForApi = (value, currency = "USDT") => {
  const rate = getCurrencyDisplayRate(currency);
  return (Number(value) / rate).toFixed(2);
};

/**
 * Formats a number in compact form: K (thousands), M (millions), B (billions).
 * @param {number} value - Numeric value
 * @param {number} [decimals=2] - Max decimal places for the numeric part
 * @returns {string} e.g. "1.25K", "12.5M", "1.06B"
 */
export const formatCompact = (value, decimals = 2) => {
  const num = Number(value);
  if (num == null || Number.isNaN(num)) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(decimals).replace(/\.?0+$/, "") + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(decimals).replace(/\.?0+$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(decimals).replace(/\.?0+$/, "") + "K";
  return num.toFixed(0);
};

/**
 * Copy text to clipboard. Works on desktop and mobile (iOS/Android).
 * Prefers Clipboard API; falls back to execCommand with a temporary input for older/mobile browsers.
 * setCopied(true) is called on success; optional alert shown if all methods fail.
 * @returns {Promise<boolean>} true if copy succeeded
 */
export const copyToClipboard = async (text, setCopied) => {
  if (!text) return false;
  const textToCopy = String(text);

  const applyCopiedState = () => {
    if (typeof setCopied === "function") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1) Prefer Clipboard API (works in secure context including mobile when triggered by user gesture)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(textToCopy);
      applyCopiedState();
      return true;
    } catch (err) {
      console.warn("Clipboard API failed:", err);
    }
  }

  // 2) Fallback: temporary input (more reliable on mobile than textarea in some cases)
  try {
    const input = document.createElement("input");
    input.value = textToCopy;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "0";
    input.style.width = "2em";
    input.style.height = "2em";
    input.style.padding = "0";
    input.style.border = "none";
    input.style.outline = "none";
    input.style.boxShadow = "none";
    input.style.background = "transparent";
    input.style.fontSize = "16px";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";
    document.body.appendChild(input);
    input.focus();
    input.select();
    input.setSelectionRange(0, textToCopy.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    if (ok) {
      applyCopiedState();
      return true;
    }
  } catch (e) {
    console.warn("Input fallback copy failed:", e);
  }

  // 3) Textarea fallback (some Android/iOS variants work better with textarea)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    textArea.style.fontSize = "16px";
    textArea.style.opacity = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textToCopy.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textArea);
    if (ok) {
      applyCopiedState();
      return true;
    }
  } catch (e) {
    console.warn("Textarea fallback copy failed:", e);
  }

  // 4) Last resort: show text so user can manually copy
  if (typeof window !== "undefined" && window.alert) {
    window.alert(`Copy this link:\n\n${textToCopy}`);
  }
  return false;
};

export const disableZoomInspect = () => {
  if (import.meta.env.VITE_ENVIRONMENT !== "production") return;
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener(
    "keydown",
    (e) => {
      // Block keyboard zoom
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "=" || e.key === "+" || e.key === "-" || e.key === "0")
      ) {
        e.preventDefault();
        return;
      }
      // Block devtools shortcuts
      // if (
      //   e.key === "F12" ||
      //   (e.ctrlKey && e.shiftKey && e.key === "I") ||
      //   (e.ctrlKey && e.shiftKey && e.key === "J") ||
      //   (e.ctrlKey && e.shiftKey && e.key === "C") ||
      //   (e.ctrlKey && e.key === "U") ||
      //   (e.metaKey && e.altKey && e.key === "i") ||
      //   (e.metaKey && e.altKey && e.key === "j")
      // ) {
      //   e.preventDefault();
      // }
    },
    { passive: false }
  );
  // Block Ctrl/Cmd + scroll zoom
  document.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), {
    passive: false,
  });
}