import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

// Supported languages for trade pages
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  // { code: "hi", label: "हिंदी" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "zh", label: "Chinese" },
];

// Namespace dedicated only to trade pages and their components
export const TRADE_NAMESPACE = "trade";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    ns: [TRADE_NAMESPACE],
    defaultNS: TRADE_NAMESPACE,
    load: "currentOnly",
    debug: false,
    backend: {
      // Vite serves from /public at the root
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      // Cache in localStorage so language persists across sessions
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

