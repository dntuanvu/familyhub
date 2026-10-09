import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, auth, ApiError } from "../lib/api";
import { AuthLayout } from "../components/AuthLayout";

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  familyId: string;
  memberId: string;
}

export function Register() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [parentName, setParentName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await api.post<RegisterResponse>("/auth/register", {
        email, password, familyName, parentName,
        locale: (i18n.resolvedLanguage ?? "en").slice(0, 2),
        timezone: tz,
      });
      auth.setTokens(res.accessToken, res.refreshToken, true);
      auth.setFamilyId(res.familyId);
      nav("/");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      visual="register"
      visualTitle={t("auth.registerTitle")}
      visualSub={t("landing.heroSub")}
    >
      <h1>{t("auth.registerTitle")}</h1>
      <form className="col" onSubmit={onSubmit}>
        <div><label>{t("auth.email")}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label>{t("auth.passwordMin")}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></div>
        <div><label>{t("auth.familyName")}</label><input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required /></div>
        <div><label>{t("auth.parentName")}</label><input value={parentName} onChange={(e) => setParentName(e.target.value)} required /></div>
        <button className="big" disabled={loading}>
          {loading ? t("common.loading") : t("auth.createBtn")}
        </button>
        {err && <div className="err">{err}</div>}
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        {t("auth.hasAccountQ")} <Link to="/login" className="auth-link">{t("auth.loginLink")}</Link>
      </p>
    </AuthLayout>
  );
}
