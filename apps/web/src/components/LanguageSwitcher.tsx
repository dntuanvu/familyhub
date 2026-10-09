import { useTranslation } from "react-i18next";
import {
  LOCALE_FLAGS,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from "@family-hub/core";
import { Menu } from "./Menu";

function toLocale(lng: string | undefined): Locale {
  if (!lng) return "en";
  if (lng.startsWith("zh")) return "zh";
  if (lng.startsWith("vi")) return "vi";
  return "en";
}

/** Flag-only language picker. Dropdown lists each language with its flag + full name. */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = toLocale(i18n.resolvedLanguage);

  return (
    <Menu
      align="right"
      triggerClassName={`lang-btn ${compact ? "compact" : ""}`}
      trigger={
        <span className="lang-flag" aria-hidden>
          {LOCALE_FLAGS[current]}
        </span>
      }
    >
      {({ close }) => (
        <>
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc}
              className={`menu-item ${loc === current ? "active" : ""}`}
              onClick={() => {
                void i18n.changeLanguage(loc);
                close();
              }}
              type="button"
              role="menuitemradio"
              aria-checked={loc === current}
              aria-label={LOCALE_LABELS[loc]}
            >
              <span style={{ fontSize: 20, marginRight: 10 }}>{LOCALE_FLAGS[loc]}</span>
              <span>{LOCALE_LABELS[loc]}</span>
              {loc === current && <span style={{ marginLeft: "auto" }}>✓</span>}
            </button>
          ))}
        </>
      )}
    </Menu>
  );
}
