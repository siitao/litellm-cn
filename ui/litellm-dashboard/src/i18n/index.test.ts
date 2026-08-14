import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, Locale, getStoredLocale, t, translations } from "./index";

describe("i18n t()", () => {
  it("resolves a dotted key for the default (Chinese) locale", () => {
    expect(t("nav.api-keys")).toBe("虚拟密钥");
    expect(t("common.save")).toBe("保存");
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
      expect(t("common.save")).toBe("Save");
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
    expect(t("nav.settings")).toBe("设置");
    expect(DEFAULT_LOCALE).toBe("zh");
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
