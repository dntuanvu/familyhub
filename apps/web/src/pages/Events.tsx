import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import type { CalendarEvent } from "../lib/types";

export function EventsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["events"], queryFn: () => api.get<CalendarEvent[]>("/events") });

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.post("/events", {
        title,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setTitle(""); setStartsAt(""); setEndsAt("");
    },
    onError: (e) => setErr(e instanceof ApiError ? e.message : "Failed"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const now = Date.now();
  const upcoming = (list.data ?? []).filter((e) => new Date(e.startsAt).getTime() >= now);
  const past = (list.data ?? []).filter((e) => new Date(e.startsAt).getTime() < now);

  return (
    <>
      <h1>{t("events.title")}</h1>

      <h2>{t("events.comingUp")}</h2>
      <div className="col">
        {upcoming.length === 0 && <p className="muted">{t("events.nothingScheduled")}</p>}
        {upcoming.map((e) => (
          <div className="kid-card" key={e.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="kid-name">{e.title}</div>
                <div className="muted">
                  🕐 {new Date(e.startsAt).toLocaleString()} → {new Date(e.endsAt).toLocaleTimeString()}
                </div>
              </div>
              <button className="danger" onClick={() => { if (confirm(t("events.deleteConfirm"))) remove.mutate(e.id); }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card pop" style={{ marginTop: 24 }}>
        <h2>{t("events.addEvent")}</h2>
        <form className="col" onSubmit={(e) => { e.preventDefault(); setErr(null); create.mutate(); }}>
          <input placeholder={t("events.titlePh")} value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="row">
            <div style={{ flex: 1 }}>
              <label>{t("events.starts")}</label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>{t("events.ends")}</label>
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </div>
          </div>
          <button className="big" disabled={create.isPending}>{t("events.submit")}</button>
          {err && <div className="err">{err}</div>}
        </form>
      </div>

      {past.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>{t("events.past")}</h2>
          <div className="col">
            {past.map((e) => (
              <div className="card" key={e.id} style={{ opacity: 0.7 }}>
                <strong>{e.title}</strong> · <span className="muted">{new Date(e.startsAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
