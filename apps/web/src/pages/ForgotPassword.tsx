import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { AuthLayout } from "../components/AuthLayout";

interface ForgotResponse {
  ok: true;
  resetUrl?: string;
}

export function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<ForgotResponse | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post<ForgotResponse>("/auth/forgot-password", {
        email,
        locale: (i18n.resolvedLanguage ?? "en").slice(0, 2),
      });
      setSent(res);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      visual="forgot"
      visualTitle={t("auth.forgotTitle")}
      visualSub={t("auth.forgotSub")}
    >
      <h1>{t("auth.forgotTitle")}</h1>
      {sent ? (
        <div className="col">
          <div className="ok-note">{t("auth.forgotSuccess")}</div>
          {sent.resetUrl && (
            <div className="dev-note">
              <div className="muted" style={{ marginBottom: 6 }}>{t("auth.forgotDevUrl")}</div>
              <a href={sent.resetUrl} style={{ wordBreak: "break-all" }}>{sent.resetUrl}</a>
            </div>
          )}
          <Link to="/login" className="auth-link" style={{ textAlign: "center", marginTop: 12 }}>
            ← {t("auth.backToLogin")}
          </Link>
        </div>
      ) : (
        <form className="col" onSubmit={onSubmit}>
          <p className="muted" style={{ margin: 0 }}>{t("auth.forgotSub")}</p>
          <div>
            <label>{t("auth.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="big" disabled={loading}>
            {loading ? t("common.loading") : t("auth.forgotSubmit")}
          </button>
          {err && <div className="err">{err}</div>}
          <Link to="/login" className="auth-link" style={{ textAlign: "center" }}>
            ← {t("auth.backToLogin")}
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
