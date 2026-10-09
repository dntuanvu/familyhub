import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, auth, ApiError } from "../lib/api";
import { AuthLayout } from "../components/AuthLayout";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  memberships: { familyId: string; memberId: string; role: "parent" | "child" }[];
}

export function Login() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState<boolean>(auth.getRememberMe());
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      auth.setTokens(res.accessToken, res.refreshToken, remember);
      if (res.memberships[0]) auth.setFamilyId(res.memberships[0].familyId);
      nav("/");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      visual="login"
      visualTitle={t("auth.loginTitle")}
      visualSub={t("landing.heroSub")}
    >
      <h1>{t("auth.loginTitle")}</h1>
      <form className="col" onSubmit={onSubmit}>
        <div>
          <label>{t("auth.email")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>{t("auth.password")}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <label className="checkbox-row">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>{t("auth.rememberMe")}</span>
          </label>
          <Link to="/forgot-password" className="auth-link">{t("auth.forgotPassword")}</Link>
        </div>
        <button className="big" disabled={loading}>
          {loading ? t("common.loading") : t("auth.loginBtn")}
        </button>
        {err && <div className="err">{err}</div>}
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        {t("auth.noAccountQ")} <Link to="/register" className="auth-link">{t("auth.createLink")}</Link>
      </p>
    </AuthLayout>
  );
}
