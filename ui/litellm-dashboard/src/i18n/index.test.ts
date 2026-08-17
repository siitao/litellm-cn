import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  Locale,
  getStoredLocale,
  setCurrentLocale,
  t,
  translations,
} from "./index";

describe("i18n t()", () => {
  it("resolves a dotted key for the default (Chinese) locale", () => {
    setCurrentLocale("zh");
    try {
      expect(t("nav.api-keys")).toBe("虚拟密钥");
      expect(t("common.save")).toBe("保存");
    } finally {
      setCurrentLocale("en");
    }
  });

  it("resolves a dotted key for a specific locale", () => {
    expect(t("nav.api-keys", "en")).toBe("Virtual Keys");
    expect(t("common.save", "en")).toBe("Save");
  });

  it("falls back zh → en when the zh entry is missing", () => {
    const zh = translations.zh;
    const saved = zh.common.save;
    delete zh.common.save;
    try {
      expect(t("common.save", "zh")).toBe("Save");
    } finally {
      zh.common.save = saved;
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(t("common.save", "fr" as unknown as Locale)).toBe("Save");
  });

  it("returns the raw key when neither locale has it", () => {
    expect(t("does.not.exist")).toBe("does.not.exist");
    expect(t("does.not.exist", "en")).toBe("does.not.exist");
  });

  it("is deterministic and never touches localStorage on the server path", () => {
    // DEFAULT_LOCALE is zh; t() must not depend on window/localStorage.
    setCurrentLocale(null);
    try {
      expect(t("nav.settings")).toBe("设置");
    } finally {
      setCurrentLocale("en");
    }
    expect(DEFAULT_LOCALE).toBe("zh");
  });

  it("resolves raw English UI strings from the ui section", () => {
    expect(t("Cancel", "zh")).toBe("取消");
    expect(t("Cancel", "en")).toBe("Cancel");
    expect(t("Guardrails &amp; Policy Compliance", "zh")).toBe("护栏与策略合规");
    expect(t("Guardrails &amp; Policy Compliance", "en")).toBe("Guardrails & Policy Compliance");
  });
});

describe("i18n getStoredLocale()", () => {
  it("defaults to zh when nothing is stored", () => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    expect(getStoredLocale()).toBe("zh");
  });

  it("returns the stored locale when it is valid", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    expect(getStoredLocale()).toBe("en");
  });

  it("ignores an invalid stored value", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    expect(getStoredLocale()).toBe("zh");
  });
});
