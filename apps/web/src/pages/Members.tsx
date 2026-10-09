import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import type { Member, MemberRole } from "../lib/types";

const KID_EMOJIS = ["🧒", "👦", "👧", "🧑", "👶", "🦸", "🧚", "🦄", "🐱", "🐶", "🐼", "🦊"];

export function MembersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });

  const [name, setName] = useState("");
  const [role, setRole] = useState<MemberRole>("child");
  const [emoji, setEmoji] = useState("🧒");
  const [err, setErr] = useState<string | null>(null);

  const createM = useMutation({
    mutationFn: () => api.post("/members", { name, role, avatarEmoji: emoji }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setName("");
    },
    onError: (e) => setErr(e instanceof ApiError ? e.message : "Failed"),
  });

  const removeM = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    createM.mutate();
  }

  return (
    <>
      <h1>{t("members.title")}</h1>
      <div className="card pop">
        <h2>{t("members.addSomeone")}</h2>
        <form className="col" onSubmit={onSubmit}>
          <input placeholder={t("members.namePh")} value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <label>{t("members.pickAvatar")}</label>
            <div className="toolbar-row">
              {KID_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`chip ${emoji === em ? "on" : ""}`}
                  onClick={() => setEmoji(em)}
                  style={{ fontSize: 24 }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <button type="button" className={`chip ${role === "child" ? "on" : ""}`} style={{ padding: "0 20px" }} onClick={() => setRole("child")}>
              {t("common.childIcon")}
            </button>
            <button type="button" className={`chip ${role === "parent" ? "on" : ""}`} style={{ padding: "0 20px" }} onClick={() => setRole("parent")}>
              {t("common.parentIcon")}
            </button>
          </div>
          <button className="big" disabled={createM.isPending}>{t("members.addBtn", { emoji })}</button>
          {err && <div className="err">{err}</div>}
        </form>
      </div>

      <div className="grid">
        {data?.map((m) => (
          <div className="kid-card" key={m.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="row">
                <span className="kid-emoji">{m.avatarEmoji}</span>
                <div>
                  <div className="kid-name">{m.name}</div>
                  <div className="muted">{m.role === "parent" ? t("common.parentIcon") : t("common.childIcon")}</div>
                </div>
              </div>
              <button
                className="danger"
                onClick={() => {
                  if (confirm(t("members.removeConfirm", { name: m.name }))) removeM.mutate(m.id);
                }}
              >
                {t("members.remove")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
