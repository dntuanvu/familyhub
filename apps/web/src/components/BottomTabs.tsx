import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NAV: { to: string; emoji: string; key: string }[] = [
  { to: "/", emoji: "🏠", key: "nav.home" },
  { to: "/tasks", emoji: "✅", key: "nav.tasks" },
  { to: "/rewards", emoji: "🎁", key: "nav.rewards" },
  { to: "/redemptions", emoji: "📬", key: "nav.requests" },
  { to: "/members", emoji: "👨‍👩‍👧", key: "nav.family" },
  { to: "/events", emoji: "📅", key: "nav.calendar" },
];

export function BottomTabs() {
  const { t } = useTranslation();
  return (
    <nav className="bottom-tabs" aria-label="Primary">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => `bottom-tab ${isActive ? "active" : ""}`}
        >
          <span className="bottom-tab-emoji">{item.emoji}</span>
          <span className="bottom-tab-label">{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
