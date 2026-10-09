import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, ApiError } from "../lib/api";
import type { Member, Task, TaskCompletion, TimeOfDay } from "../lib/types";

const WEEKDAYS: [number, string][] = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"],
  [5, "Fri"], [6, "Sat"], [7, "Sun"],
];
const TASK_ICONS = ["✅", "🪥", "🛏️", "📚", "🧦", "🚿", "🍎", "🥦", "🐶", "🧹", "🎒", "🚶"];
const todayISO = () => new Date().toISOString().slice(0, 10);

export function TasksPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<Task[]>("/tasks") });
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });
  const completions = useQuery({
    queryKey: ["completions", "today"],
    queryFn: () => api.get<TaskCompletion[]>("/task-completions", { from: todayISO(), to: todayISO() }),
  });

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("✅");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [stars, setStars] = useState(1);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [days, setDays] = useState<Set<number>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const TIME_OPTIONS: [TimeOfDay, string][] = [
    ["morning", t("tasks.morning")],
    ["afternoon", t("tasks.afternoon")],
    ["evening", t("tasks.evening")],
  ];

  const create = useMutation({
    mutationFn: () =>
      api.post("/tasks", {
        title, icon, timeOfDay, stars,
        assigneeId: assigneeId || null,
        recurrenceDays: Array.from(days),
        startDate: todayISO(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setTitle("");
    },
    onError: (e) => setErr(e instanceof ApiError ? e.message : "Failed"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const complete = useMutation({
    mutationFn: ({ task, memberId }: { task: Task; memberId: string }) =>
      api.post("/task-completions", {
        taskId: task.id, memberId, completedOn: todayISO(),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["completions"] });
      qc.invalidateQueries({ queryKey: ["balances"] });
      setCelebrate(vars.task.id);
      setTimeout(() => setCelebrate(null), 800);
    },
    onError: (e) => alert(e instanceof ApiError ? e.message : "Failed"),
  });

  function toggleDay(d: number) {
    setDays((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    create.mutate();
  }

  const doneToday = new Set((completions.data ?? []).map((c) => `${c.taskId}:${c.memberId}`));
  const kids = members.data?.filter((m) => m.role === "child") ?? [];
  const grouped: Record<TimeOfDay, Task[]> = { morning: [], afternoon: [], evening: [] };
  for (const task of tasks.data ?? []) grouped[task.timeOfDay].push(task);

  return (
    <>
      <h1>{t("tasks.title")}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{t("tasks.subtitle")}</p>

      {TIME_OPTIONS.map(([slot, label]) => (
        <section key={slot} style={{ marginBottom: 20 }}>
          <h2>{label}</h2>
          {grouped[slot].length === 0 && <p className="muted">{t("tasks.nothingHere")}</p>}
          <div className="col">
            {grouped[slot].map((task) => {
              const assigneeIds = task.assigneeId ? [task.assigneeId] : kids.map((k) => k.id);
              const allDone = assigneeIds.every((id) => doneToday.has(`${task.id}:${id}`));
              return (
                <div
                  key={task.id}
                  className={`task-card ${celebrate === task.id ? "celebrate" : ""}`}
                  style={allDone ? { opacity: 0.6, textDecoration: "line-through" } : {}}
                >
                  <div className="task-icon">{task.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      {task.recurrenceDays.length === 0 ? t("tasks.everyDay") : task.recurrenceDays.map((d) => WEEKDAYS[d - 1]![1]).join(" ")}
                      {task.assigneeId && (
                        <> · {t("tasks.forX", { name: kids.find((k) => k.id === task.assigneeId)?.name ?? "" })}</>
                      )}
                    </div>
                  </div>
                  <div className="task-stars">⭐ {task.stars}</div>
                  <div className="row">
                    {assigneeIds.map((id) => {
                      const member = kids.find((k) => k.id === id);
                      if (!member) return null;
                      const isDone = doneToday.has(`${task.id}:${id}`);
                      return (
                        <button
                          key={id}
                          className={isDone ? "ghost" : "happy"}
                          disabled={isDone}
                          onClick={() => complete.mutate({ task, memberId: id })}
                        >
                          {isDone ? "✓" : t("tasks.doneBtn")} {member.avatarEmoji}
                        </button>
                      );
                    })}
                    <button
                      className="ghost"
                      onClick={() => {
                        if (confirm(t("tasks.deleteConfirm", { title: task.title }))) remove.mutate(task.id);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="card pop" style={{ marginTop: 24 }}>
        <h2>{t("tasks.newTask")}</h2>
        <form className="col" onSubmit={onSubmit}>
          <input placeholder={t("tasks.titlePh")} value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <label>{t("tasks.pickPicture")}</label>
            <div className="toolbar-row">
              {TASK_ICONS.map((i) => (
                <button key={i} type="button" className={`chip ${icon === i ? "on" : ""}`} onClick={() => setIcon(i)} style={{ fontSize: 22 }}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label>{t("tasks.when")}</label>
            <div className="toolbar-row">
              {TIME_OPTIONS.map(([val, label]) => (
                <button key={val} type="button" className={`chip ${timeOfDay === val ? "on" : ""}`} onClick={() => setTimeOfDay(val)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <div style={{ flex: 1 }}>
              <label>{t("tasks.stars")}</label>
              <input type="number" min={0} value={stars} onChange={(e) => setStars(Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label>{t("tasks.who")}</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">{t("tasks.anyone")}</option>
                {kids.map((m) => (
                  <option key={m.id} value={m.id}>{m.avatarEmoji} {m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label>{t("tasks.days")}</label>
            <div className="toolbar-row">
              {WEEKDAYS.map(([d, label]) => (
                <button key={d} type="button" className={`chip ${days.has(d) ? "on" : ""}`} onClick={() => toggleDay(d)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button className="big" disabled={create.isPending}>{t("tasks.submit")}</button>
          {err && <div className="err">{err}</div>}
        </form>
      </div>
    </>
  );
}
