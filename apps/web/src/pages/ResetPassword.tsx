import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import { AuthLayout } from "../components/AuthLayout";

export function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (p1 !== p2) {
      setErr(t("auth.resetMismatch"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: p1 });
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.message.includes("invalid_or_expired")) {
        setErr(t("auth.resetInvalid"));
      } else {
        setErr(e instanceof ApiError ? e.message : "Failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      visual="reset"
      visualTitle={t("auth.resetTitle")}
      visualSub={t("auth.resetSub")}
    >
      <h1>{t("auth.resetTitle")}</h1>
      {!token ? (
        <div className="err">{t("auth.resetMissingToken")}</div>
      ) : done ? (
        <div className="col">
          <div className="ok-note">{t("auth.resetSuccess")}</div>
          <Link to="/login" className="auth-link" style={{ textAlign: "center", marginTop: 12 }}>
            ← {t("auth.backToLogin")}
          </Link>
        </div>
      ) : (
        <form className="col" onSubmit={onSubmit}>
          <p className="muted" style={{ margin: 0 }}>{t("auth.resetSub")}</p>
          <div>
            <label>{t("auth.newPassword")}</label>
            <input type="password" value={p1} onChange={(e) => setP1(e.target.value)} minLength={8} required />
          </div>
          <div>
            <label>{t("auth.confirmPassword")}</label>
            <input type="password" value={p2} onChange={(e) => setP2(e.target.value)} minLength={8} required />
          </div>
          <button className="big" disabled={loading}>
            {loading ? t("common.loading") : t("auth.resetSubmit")}
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
