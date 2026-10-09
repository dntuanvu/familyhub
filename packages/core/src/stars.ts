import { addDays, type DateString } from "./dates";
import type { TimeOfDay } from "./schemas";

export interface BalanceInput {
  completions: { stars_awarded: number }[];
  redemptions: { stars_spent: number; status: "pending" | "approved" | "rejected" }[];
  adjustments: { delta: number }[];
}

export interface Balance {
  earned: number;
  adjusted: number;
  spent: number;
  balance: number;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * Client-side mirror of the `member_star_balance` view, for optimistic UI.
 * The database view is the source of truth.
 * Pending redemptions count as spent; rejected ones are refunded.
 */
export function computeBalance(input: BalanceInput): Balance {
  const earned = sum(input.completions.map((c) => c.stars_awarded));
  const adjusted = sum(input.adjustments.map((a) => a.delta));
  const spent = sum(
    input.redemptions.filter((r) => r.status !== "rejected").map((r) => r.stars_spent),
  );
  return { earned, adjusted, spent, balance: earned + adjusted - spent };
}

export function groupByTimeOfDay<T extends { time_of_day: TimeOfDay; sort_order: number }>(
  tasks: T[],
): Record<TimeOfDay, T[]> {
  const groups: Record<TimeOfDay, T[]> = { morning: [], afternoon: [], evening: [] };
  for (const t of tasks) groups[t.time_of_day].push(t);
  for (const key of Object.keys(groups) as TimeOfDay[]) {
    groups[key].sort((a, b) => a.sort_order - b.sort_order);
  }
  return groups;
}

export interface DailyProgress {
  done: number;
  total: number;
  starsEarned: number;
  starsPossible: number;
  /** 0..1, 0 when there are no tasks. */
  ratio: number;
}

/**
 * Progress for one member on one day. `tasks` must already be the tasks due
 * for that member on that date (see `tasksForMemberOn`).
 */
export function dailyProgress(args: {
  tasks: { id: string; stars: number }[];
  completions: { task_id: string; member_id: string; completed_on: DateString; stars_awarded: number }[];
  memberId: string;
  date: DateString;
}): DailyProgress {
  const { tasks, completions, memberId, date } = args;
  const doneByTask = new Map<string, number>();
  for (const c of completions) {
    if (c.member_id === memberId && c.completed_on === date) {
      doneByTask.set(c.task_id, c.stars_awarded);
    }
  }
  const done = tasks.filter((t) => doneByTask.has(t.id)).length;
  const starsEarned = tasks.reduce((s, t) => s + (doneByTask.get(t.id) ?? 0), 0);
  const starsPossible = sum(tasks.map((t) => t.stars));
  return {
    done,
    total: tasks.length,
    starsEarned,
    starsPossible,
    ratio: tasks.length === 0 ? 0 : done / tasks.length,
  };
}

/**
 * Current streak: consecutive days, ending today or yesterday, on which the
 * member finished every task due. `progressByDate` holds a DailyProgress per
 * date; days with no tasks are skipped (neither break nor extend the streak).
 */
export function currentStreak(
  progressByDate: Map<DateString, DailyProgress>,
  today: DateString,
  maxLookbackDays = 366,
): number {
  let streak = 0;
  let cursor = today;
  for (let i = 0; i < maxLookbackDays; i++) {
    const p = progressByDate.get(cursor);
    if (p && p.total > 0) {
      if (p.done === p.total) streak++;
      else if (cursor !== today) break; // an unfinished past day ends the streak
      // an unfinished *today* doesn't break it yet
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}
