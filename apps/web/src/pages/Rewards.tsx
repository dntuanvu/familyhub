import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import type { Member, Reward, StarBalance } from "../lib/types";

const REWARD_ICONS = ["🎁", "🍦", "🍫", "🎮", "📱", "🎬", "🛝", "🏀", "🧸", "🚲", "🎨", "🧩"];

export function RewardsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const rewards = useQuery({ queryKey: ["rewards"], queryFn: () => api.get<Reward[]>("/rewards") });
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });
  const balances = useQuery({ queryKey: ["balances"], queryFn: () => api.get<StarBalance[]>("/star-balance") });

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🎁");
  const [starCost, setStarCost] = useState(10);
  const [maxPerWeek, setMaxPerWeek] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<string>("");

  const create = useMutation({
    mutationFn: () =>
      api.post("/rewards", {
        title, icon, starCost,
        maxPerWeek: maxPerWeek ? Number(maxPerWeek) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      setTitle("");
    },
    onError: (e) => setErr(e instanceof ApiError ? e.message : "Failed"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/rewards/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rewards"] }),
  });
  const redeem = useMutation({
    mutationFn: (args: { rewardId: string; memberId: string }) => api.post("/redemptions", args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["redemptions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
    },
    onError: (e) => alert(e instanceof ApiError ? e.message : "Failed"),
  });

  const kids = members.data?.filter((m) => m.role === "child") ?? [];
  const activeKid = kids.find((k) => k.id === picked) ?? kids[0];
  const activeBalance = balances.data?.find((b) => b.memberId === activeKid?.id);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    create.mutate();
  }

  return (
    <>
      <h1>{t("rewards.title")}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{t("rewards.subtitle")}</p>

      {kids.length > 0 && (
        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="toolbar-row">
            {kids.map((k) => {
              const b = balances.data?.find((x) => x.memberId === k.id);
              return (
                <button
                  key={k.id}
                  type="button"
                  className={`chip ${(activeKid?.id ?? "") === k.id ? "on" : ""}`}
                  style={{ padding: "0 16px", height: 56, fontSize: 18 }}
                  onClick={() => setPicked(k.id)}
                >
                  {k.avatarEmoji} {k.name} · ⭐{b?.balance ?? 0}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid">
        {rewards.data?.map((r) => {
          const canAfford = (activeBalance?.balance ?? 0) >= r.starCost;
          return (
            <div className="kid-card reward-card" key={r.id}>
              <div style={{ fontSize: 60, textAlign: "center" }}>{r.icon}</div>
              <div style={{ textAlign: "center" }}>
                <div className="kid-name">{r.title}</div>
                <div className="task-stars" style={{ display: "inline-block", marginTop: 6 }}>⭐ {r.starCost}</div>
                {r.maxPerWeek && <div className="muted">{t("rewards.maxPerWeek", { n: r.maxPerWeek })}</div>}
              </div>
              <div className="row" style={{ marginTop: 10, justifyContent: "center" }}>
                <button
                  className="happy"
                  disabled={!activeKid || !canAfford}
                  onClick={() => activeKid && redeem.mutate({ rewardId: r.id, memberId: activeKid.id })}
                >
                  {canAfford ? t("rewards.iWantIt") : t("rewards.needMore")}
                </button>
                <button
                  className="ghost"
                  onClick={() => {
                    if (confirm(t("rewards.removeConfirm", { title: r.title }))) remove.mutate(r.id);
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card pop" style={{ marginTop: 24 }}>
        <h2>{t("rewards.newReward")}</h2>
        <form className="col" onSubmit={onSubmit}>
          <input placeholder={t("rewards.titlePh")} value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <label>{t("rewards.pickPicture")}</label>
            <div className="toolbar-row">
              {REWARD_ICONS.map((i) => (
                <button key={i} type="button" className={`chip ${icon === i ? "on" : ""}`} onClick={() => setIcon(i)} style={{ fontSize: 22 }}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <div style={{ flex: 1 }}>
              <label>{t("rewards.starCost")}</label>
              <input type="number" min={1} value={starCost} onChange={(e) => setStarCost(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label>{t("rewards.maxPerWeekOpt", { optional: t("common.optional") })}</label>
              <input type="number" min={1} placeholder={t("rewards.unlimited")} value={maxPerWeek} onChange={(e) => setMaxPerWeek(e.target.value)} />
            </div>
          </div>
          <button className="big" disabled={create.isPending}>{t("rewards.submit")}</button>
          {err && <div className="err">{err}</div>}
        </form>
      </div>
    </>
  );
}
