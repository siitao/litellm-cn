"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Inline language toggle shown in the top bar.
 * Renders the *other* locale's label (中文 ⇄ English) so it always advertises
 * what clicking it will switch to; the choice persists via localStorage.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  const toggle = () => setLocale(locale === "zh" ? "en" : "zh");

  return (
    <Button variant="ghost" size="sm" onClick={toggle} title={t("language.label")}>
      {locale === "zh" ? t("language.switch_to_en") : t("language.switch_to_zh")}
    </Button>
  );
}
