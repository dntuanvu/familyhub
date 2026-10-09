import en from "./en.json";
import zh from "./zh.json";
import vi from "./vi.json";

export const translations = { en, zh, vi } as const;
export type Locale = keyof typeof translations;
export const SUPPORTED_LOCALES: Locale[] = ["en", "zh", "vi"];
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "简体中文",
  vi: "Tiếng Việt",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  zh: "🇨🇳",
  vi: "🇻🇳",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  vi: "VI",
};

export type TranslationKeys = typeof en;
