"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  Locale,
  TFunction,
  setCurrentLocale,
  t as translate,
} from "@/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a key for the current locale (dotted path, e.g. "nav.api-keys"). */
  t: TFunction;
}

// Fallback used when a component renders outside the LanguageProvider (e.g. unit
// tests): resolve to English so the canonical dictionary is shown rather than a
// raw key. In the app every consumer sits under the provider, so this is only a
// safety net.
const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translate(key, "en"),
});

const antdLocales: Record<Locale, typeof enUS> = {
  en: enUS,
  zh: zhCN,
};

// Lazy init (same pattern as PluginModeContext) so the first client render
// already matches what SSR produced — no flash of the wrong language and no
// hydration mismatch from a useEffect-based hydrate.
function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" || stored === "zh" ? stored : DEFAULT_LOCALE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  // Keep <html lang> in sync for screen readers and browser translation.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (e.g. privacy mode) — still switch in-memory.
    }
    setLocaleState(next);
    setCurrentLocale(next);
  }, []);

  // Keep the module-level locale (used by pure `t()` in module scope / server
  // components) in sync with the persisted choice.
  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const t = useCallback((key: string) => translate(key, locale), [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      <ConfigProvider locale={antdLocales[locale]}>{children}</ConfigProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
