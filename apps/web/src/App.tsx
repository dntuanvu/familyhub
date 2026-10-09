import { useEffect, useState, useSyncExternalStore } from "react";
import { Route, Routes } from "react-router-dom";
import { auth } from "./lib/api";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { MembersPage } from "./pages/Members";
import { TasksPage } from "./pages/Tasks";
import { RewardsPage } from "./pages/Rewards";
import { RedemptionsPage } from "./pages/Redemptions";
import { EventsPage } from "./pages/Events";
import { TopBar } from "./components/TopBar";
import { Drawer } from "./components/Drawer";
import { BottomTabs } from "./components/BottomTabs";

const DRAWER_COLLAPSED_KEY = "fh.drawerCollapsed";
const MOBILE_BREAKPOINT = 820;
const isMobileView = () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

function useIsMobile() {
  const [mobile, setMobile] = useState<boolean>(() => isMobileView());
  useEffect(() => {
    const onResize = () => setMobile(isMobileView());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return mobile;
}

function Shell({ children }: { children: React.ReactNode }) {
  const mobile = useIsMobile();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(DRAWER_COLLAPSED_KEY);
      if (stored !== null) return stored === "1";
    } catch {
      // ignore
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(DRAWER_COLLAPSED_KEY, collapsed ? "1" : "0"); } catch { /* noop */ }
  }, [collapsed]);

  useEffect(() => {
    if (!mobile) setMobileOpen(false);
  }, [mobile]);

  function onToggleDrawer() {
    if (mobile) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  }

  return (
    <div className={`shell ${mobile ? "is-mobile" : ""}`}>
      <TopBar onToggleDrawer={onToggleDrawer} showToggle={!mobile} />
      <div className="shell-body">
        {!mobile && (
          <Drawer
            open={mobileOpen}
            collapsed={collapsed}
            onClose={() => setMobileOpen(false)}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
          />
        )}
        <main className={`shell-main ${!mobile && collapsed ? "drawer-collapsed" : ""}`}>
          {children}
        </main>
      </div>
      {mobile && <BottomTabs />}
    </div>
  );
}

export function App() {
  const signedIn = useSyncExternalStore(
    auth.subscribe,
    () => !!auth.getAccessToken(),
    () => false,
  );
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {signedIn ? (
        <Route
          path="/*"
          element={
            <Shell>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="rewards" element={<RewardsPage />} />
                <Route path="redemptions" element={<RedemptionsPage />} />
                <Route path="events" element={<EventsPage />} />
              </Routes>
            </Shell>
          }
        />
      ) : (
        <Route path="/*" element={<Landing />} />
      )}
    </Routes>
  );
}
