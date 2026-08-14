import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LOCALE_STORAGE_KEY } from "@/i18n";
import { LanguageProvider, useLanguage } from "./LanguageContext";

function LocaleProbe() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="translation">{t("common.save")}</span>
      <button type="button" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>
        toggle
      </button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <LanguageProvider>
      <LocaleProbe />
    </LanguageProvider>,
  );

describe("LanguageProvider", () => {
  beforeEach(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
  });

  it("defaults to Chinese (zh) with no stored preference", () => {
    renderProbe();
    expect(screen.getByTestId("locale").textContent).toBe("zh");
    expect(screen.getByTestId("translation").textContent).toBe("保存");
  });

  it("hydrates a stored English preference", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    renderProbe();
    expect(screen.getByTestId("locale").textContent).toBe("en");
    expect(screen.getByTestId("translation").textContent).toBe("Save");
  });

  it("switches locale and persists the choice to localStorage", () => {
    renderProbe();
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("locale").textContent).toBe("en");
    expect(screen.getByTestId("translation").textContent).toBe("Save");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("ignores an invalid stored value and falls back to Chinese", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    renderProbe();
    expect(screen.getByTestId("locale").textContent).toBe("zh");
  });
});
