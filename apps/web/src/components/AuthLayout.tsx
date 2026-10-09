import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Keyed presets so each auth page gets its own color + emoji vibe. */
export type AuthVisual = "login" | "register" | "forgot" | "reset";

const VISUALS: Record<AuthVisual, {
  gradient: string;
  mainEmoji: string;
  floaters: string[];
}> = {
  login: {
    gradient: "linear-gradient(135deg, #fef3c7 0%, #fde4e4 60%, #ede9fe 100%)",
    mainEmoji: "👨‍👩‍👧‍👦",
    floaters: ["⭐", "🎁", "🌈", "🧸", "📚", "🎨", "🪥", "🎉"],
  },
  register: {
    gradient: "linear-gradient(135deg, #dbeafe 0%, #d1fae5 55%, #fef3c7 100%)",
    mainEmoji: "🏡",
    floaters: ["🌟", "🧩", "🎈", "🦄", "🎒", "🪁", "🌞", "🎁"],
  },
  forgot: {
    gradient: "linear-gradient(135deg, #fef3c7 0%, #fde4e4 100%)",
    mainEmoji: "🔑",
    floaters: ["✨", "💭", "📧", "🤔", "🌟"],
  },
  reset: {
    gradient: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)",
    mainEmoji: "🔐",
    floaters: ["✨", "🔒", "🛡️", "🌟", "🔑"],
  },
};

interface AuthLayoutProps {
  visual: AuthVisual;
  /** Big heading inside the visual panel. */
  visualTitle: string;
  visualSub?: string;
  children: ReactNode;
}

export function AuthLayout({ visual, visualTitle, visualSub, children }: AuthLayoutProps) {
  const { t } = useTranslation();
  const preset = VISUALS[visual];

  return (
    <div className="auth-split">
      <Link to="/" className="auth-back" aria-label={t("common.appName")}>
        <span style={{ fontSize: 18 }}>←</span>
        <span style={{ fontSize: 22 }}>👨‍👩‍👧‍👦</span>
        <strong>{t("common.appName")}</strong>
      </Link>

      <aside className="auth-visual" style={{ background: preset.gradient }}>
        <div className="auth-visual-floaters" aria-hidden>
          {preset.floaters.map((e, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 83 + 11) % 100}%`,
                top: `${(i * 47 + 17) % 100}%`,
                animationDelay: `${(i % 5) * 0.5}s`,
                fontSize: 28 + (i % 4) * 14,
                opacity: 0.35 + (i % 3) * 0.1,
              }}
            >
              {e}
            </span>
          ))}
        </div>
        <div className="auth-visual-main">
          <div className="auth-visual-emoji">{preset.mainEmoji}</div>
          <h2 className="auth-visual-title">{visualTitle}</h2>
          {visualSub && <p className="auth-visual-sub">{visualSub}</p>}
        </div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-form-top">
          <LanguageSwitcher compact />
        </div>
        <div className="auth-form-inner">{children}</div>
      </section>
    </div>
  );
}
