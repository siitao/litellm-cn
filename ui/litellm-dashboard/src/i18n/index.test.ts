import { readFileSync, readdirSync } from "fs";
import { join, relative, sep } from "path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  Locale,
  NestedMap,
  getStoredLocale,
  resolveKey,
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

const SRC_ROOT = join(__dirname, "..");

// Matches t("literal") / translate("literal") calls whose argument is a single
// static string, so a dictionary entry cannot go missing unnoticed.
const T_CALL = /(?:^|[^A-Za-z0-9_$.])(?:t|translate)\(\s*"((?:[^"\\\n]|\\.)*)"\s*\)/g;

function sourceFiles(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!/\.tsx?$/.test(entry.name) || /\.test\.[tj]sx?$/.test(entry.name)) return [];
    return [full];
  });
}

function decodeStringLiteral(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`) as string;
  } catch {
    return raw;
  }
}

function literalKeysInUse(): readonly { readonly file: string; readonly key: string }[] {
  return sourceFiles(SRC_ROOT).flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(T_CALL)].map((match) => ({
      file: relative(SRC_ROOT, file).split(sep).join("/"),
      key: decodeStringLiteral(match[1]),
    })),
  );
}

function leafPaths(map: NestedMap, prefix = ""): readonly string[] {
  return Object.entries(map).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" || Array.isArray(value) ? [path] : leafPaths(value, path);
  });
}

describe("i18n coverage guards", () => {
  it("scans a non-trivial slice of the dashboard", () => {
    // Guards the guard: if SRC_ROOT or T_CALL ever stops matching anything, the
    // two coverage assertions below would pass vacuously.
    expect(literalKeysInUse().length).toBeGreaterThan(5000);
  });

  it("keeps the en and zh dictionaries key-for-key identical", () => {
    const enPaths = new Set(leafPaths(translations.en));
    const zhPaths = new Set(leafPaths(translations.zh));
    expect([...enPaths].filter((p) => !zhPaths.has(p))).toEqual([]);
    expect([...zhPaths].filter((p) => !enPaths.has(p))).toEqual([]);
  });

  it("translates every t() literal used in the dashboard", () => {
    const missing = literalKeysInUse()
      .filter(({ key }) => resolveKey(translations.zh, key) === undefined)
      .map(({ file, key }) => `${file} -> ${key}`);
    expect([...new Set(missing)].sort()).toEqual([]);
  });
});
