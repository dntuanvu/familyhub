import { useTranslation } from "react-i18next";
import { useMe } from "../hooks/useAuth";
import { auth } from "../lib/api";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoutButton } from "./LogoutButton";
import { Menu } from "./Menu";

interface TopBarProps {
  onToggleDrawer: () => void;
  showToggle?: boolean;
}

export function TopBar({ onToggleDrawer, showToggle = true }: TopBarProps) {
  const { t } = useTranslation();
  const { data: me } = useMe();

  const currentFamily =
    me?.memberships.find((m) => m.familyId === auth.getFamilyId()) ?? me?.memberships[0];
  const name = currentFamily?.name ?? me?.email ?? "";

  return (
    <header className="topbar">
      {showToggle && (
        <button className="icon-btn" onClick={onToggleDrawer} aria-label="Toggle menu" type="button">
          <span style={{ fontSize: 22 }}>☰</span>
        </button>
      )}

      <div className="topbar-brand">
        <span style={{ fontSize: 24 }}>👨‍👩‍👧‍👦</span>
        <strong>{t("common.appName")}</strong>
      </div>

      <div className="topbar-spacer" />

      <LanguageSwitcher compact />

      <Menu
        align="right"
        triggerClassName="profile-trigger"
        trigger={
          <>
            <span className="profile-avatar">
              {currentFamily?.role === "parent" ? "🧑" : currentFamily?.role === "child" ? "🧒" : "🙂"}
            </span>
            <span className="profile-name">{name}</span>
            <span className="lang-caret">▾</span>
          </>
        }
      >
        {() => (
          <div className="menu-head">
            <div style={{ fontWeight: 700 }}>{name}</div>
            <div className="muted" style={{ fontSize: 13 }}>{me?.email}</div>
            {currentFamily && (
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {currentFamily.family.name}{" "}
                <span className="pill" style={{ marginLeft: 4 }}>
                  {currentFamily.role === "parent" ? t("common.parentIcon") : t("common.childIcon")}
                </span>
              </div>
            )}
          </div>
        )}
      </Menu>

      <LogoutButton />
    </header>
  );
}
