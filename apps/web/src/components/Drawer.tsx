import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface NavItem { to: string; emoji: string; key: string }
const NAV: NavItem[] = [
  { to: "/", emoji: "🏠", key: "nav.home" },
  { to: "/tasks", emoji: "✅", key: "nav.tasks" },
  { to: "/rewards", emoji: "🎁", key: "nav.rewards" },
  { to: "/redemptions", emoji: "📬", key: "nav.requests" },
  { to: "/members", emoji: "👨‍👩‍👧", key: "nav.family" },
  { to: "/events", emoji: "📅", key: "nav.calendar" },
];

interface DrawerProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
}

export function Drawer({ open, collapsed, onClose, onToggleCollapsed }: DrawerProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className={`drawer-scrim ${open ? "visible" : ""}`} onClick={onClose} aria-hidden />
      <aside className={`drawer ${collapsed ? "collapsed" : ""} ${open ? "open" : ""}`} aria-label="Main menu">
        <div className="drawer-head">
          {!collapsed && <strong>{t("common.appName")}</strong>}
          <button
            className="icon-btn drawer-collapse"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            type="button"
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
              title={t(item.key)}
            >
              <span className="drawer-emoji">{item.emoji}</span>
              {!collapsed && <span className="drawer-label">{t(item.key)}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
