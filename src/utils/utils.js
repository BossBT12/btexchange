/**
 * Formats pair label for display: -USD -> -USDT
 */
export const formatPairForDisplay = (pair) => {
  if (!pair || typeof pair !== "string") return pair ?? "";
  return pair.replace(/-USD$/i, "USDT");
};

// Display-only currencies
export const DISPLAY_CURRENCIES = [
  { code: "USDT", label: "USDT" },
  { code: "USD", label: "US dollar" },
  { code: "MYR", label: "Ringgit malaysia" },
  { code: "IDR", label: "Indonesian rupiah" },
  { code: "CNY", label: "Chinese yuan" },
  { code: "AUD", label: "Australian dollar" },
  { code: "THB", label: "Thailand baht" },
  { code: "INR", label: "Indian rupee" },
  { code: "PHP", label: "Philippine peso" },
  { code: "JPY", label: "Japanese yen" },
  { code: "KRW", label: "Korean won" },
  { code: "RUB", label: "Russian ruble" },
  { code: "EUR", label: "Euro" },
  { code: "VND", label: "Vietnamese dong" },
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
  KRW: 1300,
  RUB: 100,
  EUR: 0.92,
  VND: 23000,
};

export const getCurrencyDisplayRate = (currency = "USDT") =>
  CURRENCY_TO_USDT_RATES[currency] ?? 1;

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

export const formatCurrencyForApi = (value, currency = "USDT") => {
  const rate = getCurrencyDisplayRate(currency);
  return (Number(value) / rate).toFixed(2);
};

export const formatCompact = (value, decimals = 2) => {
  const num = Number(value);

  if (num == null || Number.isNaN(num)) return "0";

  if (num >= 1e9) {
    return (
      (num / 1e9).toFixed(decimals).replace(/\.?0+$/, "") + "B"
    );
  }

  if (num >= 1e6) {
    return (
      (num / 1e6).toFixed(decimals).replace(/\.?0+$/, "") + "M"
    );
  }

  if (num >= 1e3) {
    return (
      (num / 1e3).toFixed(decimals).replace(/\.?0+$/, "") + "K"
    );
  }

  return num.toFixed(0);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text, setCopied) => {
  if (!text) return false;

  const textToCopy = String(text);

  const applyCopiedState = () => {
    if (typeof setCopied === "function") {
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  // Modern clipboard API
  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      applyCopiedState();
      return true;
    } catch (err) {
      console.warn("Clipboard API failed:", err);
    }
  }

  // Fallback for mobile browsers
  try {
    const textarea = document.createElement("textarea");

    textarea.value = textToCopy;
    textarea.setAttribute("readonly", "");

    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    textarea.style.fontSize = "16px";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textToCopy.length);

    const success = document.execCommand("copy");

    document.body.removeChild(textarea);

    if (success) {
      applyCopiedState();
      return true;
    }
  } catch (err) {
    console.warn("Fallback copy failed:", err);
  }

  return false;
};

/**
 * Disable inspect shortcuts (SAFE VERSION)
 * Does NOT break mobile paste/copy/select
 */
export const disableZoomInspect = () => {
  // if (import.meta.env.VITE_ENVIRONMENT !== "production") return;

  document.addEventListener(
    "keydown",
    (e) => {
      // Block browser zoom shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        ["=", "+", "-", "0"].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // Block common devtools shortcuts
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U") ||
        (e.metaKey && e.altKey && ["i", "j"].includes(e.key))
      ) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent Ctrl/Cmd + wheel zoom
  document.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
};

export const formatDateInt = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(dateString);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};
