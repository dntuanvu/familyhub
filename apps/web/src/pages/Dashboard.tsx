import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import type { Member, StarBalance, Task, TaskCompletion } from "../lib/types";

const WEEKDAY_INDEX_TO_ISO = [7, 1, 2, 3, 4, 5, 6];
const todayISO = () => new Date().toISOString().slice(0, 10);
const todayWeekday = () => WEEKDAY_INDEX_TO_ISO[new Date().getDay()]!;

function tasksForMemberToday(tasks: Task[], memberId: string): Task[] {
  const d = todayISO();
  const wd = todayWeekday();
  return tasks.filter((t) => {
    if (!t.active) return false;
    if (t.startDate.slice(0, 10) > d) return false;
    if (t.endDate && t.endDate.slice(0, 10) < d) return false;
    if (t.assigneeId && t.assigneeId !== memberId) return false;
    if (t.recurrenceDays.length > 0 && !t.recurrenceDays.includes(wd)) return false;
    return true;
  });
}

export function Dashboard() {
  const { t } = useTranslation();
  const members = useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members") });
  const balances = useQuery({ queryKey: ["balances"], queryFn: () => api.get<StarBalance[]>("/star-balance") });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => api.get<Task[]>("/tasks") });
  const completions = useQuery({
    queryKey: ["completions", "today"],
    queryFn: () => api.get<TaskCompletion[]>("/task-completions", { from: todayISO(), to: todayISO() }),
  });

  const kids = (members.data ?? []).filter((m) => m.role === "child");
  const parents = (members.data ?? []).filter((m) => m.role === "parent");

  return (
    <>
      <h1>{t("dashboard.greeting")}</h1>
      <p className="muted" style={{ fontSize: 16, marginTop: -8 }}>{t("dashboard.subGreeting")}</p>

      {kids.length === 0 && (
        <div className="card">
          <h2>{t("dashboard.addKidsFirst")}</h2>
          <p className="muted">{t("dashboard.addKidsHint")}</p>
        </div>
      )}

      <div className="grid">
        {kids.map((m) => {
          const b = balances.data?.find((x) => x.memberId === m.id);
          const dueToday = tasksForMemberToday(tasks.data ?? [], m.id);
          const doneTaskIds = new Set(
            (completions.data ?? [])
              .filter((c) => c.memberId === m.id && c.completedOn.slice(0, 10) === todayISO())
              .map((c) => c.taskId),
          );
          const done = dueToday.filter((t) => doneTaskIds.has(t.id)).length;
          const ratio = dueToday.length === 0 ? 0 : done / dueToday.length;

          return (
            <div className="kid-card" key={m.id} style={{ background: `linear-gradient(135deg, #fff, ${m.color}22)` }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row" style={{ gap: 14 }}>
                  <div className="kid-emoji">{m.avatarEmoji}</div>
                  <div>
                    <div className="kid-name">{m.name}</div>
                    <div className="muted">{t("dashboard.tasksToday", { count: dueToday.length })}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="kid-stars">⭐ {b?.balance ?? 0}</div>
                </div>
              </div>
              <div className="progress"><div style={{ width: `${Math.round(ratio * 100)}%` }} /></div>
              <div className="muted" style={{ marginTop: 6 }}>
                {t("dashboard.doneRatio", { done, total: dueToday.length })}{" "}
                {ratio === 1 && dueToday.length > 0 && <span className="pill ok">{t("dashboard.allDone")}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {parents.length > 0 && (
        <>
          <h2 style={{ marginTop: 28 }}>{t("dashboard.grownUps")}</h2>
          <div className="row">
            {parents.map((m) => (
              <div key={m.id} className="card" style={{ margin: 0, minWidth: 200 }}>
                <span style={{ fontSize: 28 }}>{m.avatarEmoji}</span>{" "}
                <strong style={{ fontSize: 18 }}>{m.name}</strong>{" "}
                <span className="pill">{t("common.parent").toLowerCase()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
