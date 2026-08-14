/**
 * LiteLLM Dashboard i18n — lightweight, dependency-free translation layer.
 *
 * English is the canonical dictionary; Chinese (中文) is the default locale for
 * this fork. The pure `t()` helper is deterministic and SSR-safe — it never
 * touches localStorage — so it can be called from module scope or server
 * components. Language state lives in LanguageContext (client-only), which
 * hydrates from localStorage via a lazy initializer (see PluginModeContext).
 *
 * Keys are dotted paths into the locale JSON ("nav.api-keys", "common.save").
 * Values may contain `{placeholder}` tokens; callers interpolate them with
 * `.replace("{name}", value)` — see usages in the DataTable pagination.
 */

import en from "./locales/en.json";
import zh from "./locales/zh.json";

export type Locale = "en" | "zh";

/** A translation function (a `t` bound to a specific locale). */
export type TFunction = (key: string) => string;

type NestedMap = {
  [key: string]: string | NestedMap;
};

const translations: Record<Locale, NestedMap> = { en, zh };

/** localStorage key used by LanguageContext to persist the user's choice. */
export const LOCALE_STORAGE_KEY = "litellm_locale";

/** Default locale for this fork — Chinese-first. */
export const DEFAULT_LOCALE: Locale = "zh";

/** Supported locales, in the order they appear in the switcher. */
export const SUPPORTED_LOCALES: { value: Locale; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

function resolve(map: NestedMap, key: string): string | undefined {
  let node: string | NestedMap | undefined = map;
  for (const part of key.split(".")) {
    if (node == null || typeof node === "string") return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

/**
 * Translate `key` for `locale` (defaults to DEFAULT_LOCALE).
 * Falls back zh → en → the raw key so a missing entry never renders blank.
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const map = translations[locale] ?? translations.en;
  const direct = resolve(map, key);
  if (direct != null) return direct;
  if (locale !== "en") {
    const fallback = resolve(translations.en, key);
    if (fallback != null) return fallback;
  }
  return key;
}

/** Client-only: read the persisted locale, falling back to the default. */
export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" || stored === "zh" ? stored : DEFAULT_LOCALE;
}

/** Exported for tests and advanced consumers that need raw dictionaries. */
export { translations };
