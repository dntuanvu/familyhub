import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import type { Member, Redemption, Reward } from "../lib/types";

export function RedemptionsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["redemptions"], queryFn: () => api.get<Redemption[]>("/redemptions") });
  const rewards = useQuery({ queryKey: ["rewards"], queryFn: () => api.get<Reward[]>("/rewards") });
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });

  const decide = useMutation({
    mutationFn: (args: { id: string; status: "approved" | "rejected" }) =>
      api.patch(`/redemptions/${args.id}`, { status: args.status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["redemptions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
    },
    onError: (e) => alert(e instanceof ApiError ? e.message : "Failed"),
  });

  const reward = (id: string) => rewards.data?.find((r) => r.id === id);
  const member = (id: string) => members.data?.find((m) => m.id === id);

  const pending = (list.data ?? []).filter((r) => r.status === "pending");
  const decided = (list.data ?? []).filter((r) => r.status !== "pending");

  return (
    <>
      <h1>{t("redemptions.title")}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{t("redemptions.subtitle")}</p>

      <h2>{t("redemptions.waiting", { count: pending.length })}</h2>
      <div className="col">
        {pending.length === 0 && <p className="muted">{t("redemptions.nothingPending")}</p>}
        {pending.map((r) => {
          const rw = reward(r.rewardId);
          const m = member(r.memberId);
          return (
            <div className="kid-card" key={r.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row">
                  <span className="kid-emoji">{rw?.icon ?? "🎁"}</span>
                  <div>
                    <div className="kid-name">
                      {m?.avatarEmoji} {t("redemptions.wants", { member: m?.name ?? "" })} <strong>{rw?.title ?? "?"}</strong>
                    </div>
                    <div className="muted">⭐ {r.starsSpent} · {new Date(r.requestedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="row">
                  <button className="happy" onClick={() => decide.mutate({ id: r.id, status: "approved" })}>
                    {t("redemptions.approve")}
                  </button>
                  <button className="danger" onClick={() => decide.mutate({ id: r.id, status: "rejected" })}>
                    {t("redemptions.reject")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: 24 }}>{t("redemptions.history")}</h2>
      <div className="col">
        {decided.map((r) => {
          const rw = reward(r.rewardId);
          const m = member(r.memberId);
          return (
            <div className="card" key={r.id} style={{ marginBottom: 8 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  {rw?.icon} <strong>{m?.name}</strong> → {rw?.title} · ⭐ {r.starsSpent}
                </div>
                <span className={`pill ${r.status === "approved" ? "ok" : "err"}`}>
                  {t(`redemptions.${r.status}` as const)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
