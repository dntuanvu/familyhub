import { describe, expect, it } from "vitest";
import {
  addDays,
  computeBalance,
  currentStreak,
  dailyProgress,
  getRewardStatus,
  groupByTimeOfDay,
  isoWeekday,
  isTaskDueOn,
  nextGoal,
  parseRedemptionError,
  startOfWeek,
  taskInputSchema,
  tasksForMemberOn,
  toDateStringInTz,
  weekDates,
  type DailyProgress,
} from "./index";

describe("dates", () => {
  it("computes ISO weekday (2026-09-16 is a Wednesday)", () => {
    expect(isoWeekday("2026-09-16")).toBe(3);
    expect(isoWeekday("2026-09-20")).toBe(7);
    expect(isoWeekday("2026-09-14")).toBe(1);
  });

  it("finds week start for Monday- and Sunday-first weeks", () => {
    expect(startOfWeek("2026-09-16")).toBe("2026-09-14");
    expect(startOfWeek("2026-09-20")).toBe("2026-09-14");
    expect(startOfWeek("2026-09-16", 7)).toBe("2026-09-13");
    expect(startOfWeek("2026-09-20", 7)).toBe("2026-09-20");
  });

  it("builds the 14-20 September week from the screenshot", () => {
    const w = weekDates("2026-09-16");
    expect(w[0]).toBe("2026-09-14");
    expect(w[6]).toBe("2026-09-20");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("converts an instant to the family's local date", () => {
    // 20:00 UTC on the 15th is already the 16th in Ho Chi Minh City (UTC+7)
    expect(toDateStringInTz("2026-09-15T20:00:00Z", "Asia/Ho_Chi_Minh")).toBe("2026-09-16");
    expect(toDateStringInTz("2026-09-15T20:00:00Z", "UTC")).toBe("2026-09-15");
  });
});

describe("recurrence", () => {
  const base = { recurrence_days: [] as number[], start_date: "2026-09-01", end_date: null, active: true };

  it("empty recurrence means every day", () => {
    expect(isTaskDueOn(base, "2026-09-16")).toBe(true);
  });

  it("respects weekdays", () => {
    const weekdays = { ...base, recurrence_days: [1, 2, 3, 4, 5] };
    expect(isTaskDueOn(weekdays, "2026-09-16")).toBe(true); // Wed
    expect(isTaskDueOn(weekdays, "2026-09-19")).toBe(false); // Sat
  });

  it("respects start/end dates and active flag", () => {
    const t = { ...base, end_date: "2026-09-30" };
    expect(isTaskDueOn(t, "2026-08-31")).toBe(false);
    expect(isTaskDueOn(t, "2026-09-30")).toBe(true);
    expect(isTaskDueOn(t, "2026-10-01")).toBe(false);
    expect(isTaskDueOn({ ...base, active: false }, "2026-09-16")).toBe(false);
  });

  it("includes unassigned tasks for every member", () => {
    const tasks = [
      { ...base, id: "a", assignee_id: null },
      { ...base, id: "b", assignee_id: "kid1" },
      { ...base, id: "c", assignee_id: "kid2" },
    ];
    expect(tasksForMemberOn(tasks, "kid1", "2026-09-16").map((t) => t.id)).toEqual(["a", "b"]);
  });
});

describe("stars", () => {
  it("balance = earned + adjustments - non-rejected redemptions", () => {
    const r = computeBalance({
      completions: [{ stars_awarded: 1 }, { stars_awarded: 1 }, { stars_awarded: 2 }],
      adjustments: [{ delta: 10 }, { delta: -1 }],
      redemptions: [
        { stars_spent: 5, status: "approved" },
        { stars_spent: 3, status: "pending" },
        { stars_spent: 100, status: "rejected" },
      ],
    });
    expect(r).toEqual({ earned: 4, adjusted: 9, spent: 8, balance: 5 });
  });

  it("groups tasks by time of day in sort order", () => {
    const g = groupByTimeOfDay([
      { time_of_day: "morning" as const, sort_order: 2, n: "b" },
      { time_of_day: "morning" as const, sort_order: 1, n: "a" },
      { time_of_day: "evening" as const, sort_order: 0, n: "c" },
    ]);
    expect(g.morning.map((t) => t.n)).toEqual(["a", "b"]);
    expect(g.afternoon).toEqual([]);
    expect(g.evening).toHaveLength(1);
  });

  it("computes daily progress for one member", () => {
    const p = dailyProgress({
      tasks: [
        { id: "t1", stars: 1 },
        { id: "t2", stars: 1 },
        { id: "t3", stars: 2 },
      ],
      completions: [
        { task_id: "t1", member_id: "kid", completed_on: "2026-09-16", stars_awarded: 1 },
        { task_id: "t3", member_id: "kid", completed_on: "2026-09-16", stars_awarded: 2 },
        { task_id: "t2", member_id: "other", completed_on: "2026-09-16", stars_awarded: 1 },
        { task_id: "t2", member_id: "kid", completed_on: "2026-09-15", stars_awarded: 1 },
      ],
      memberId: "kid",
      date: "2026-09-16",
    });
    expect(p).toEqual({ done: 2, total: 3, starsEarned: 3, starsPossible: 4, ratio: 2 / 3 });
  });

  it("returns ratio 0 when there are no tasks", () => {
    const p = dailyProgress({ tasks: [], completions: [], memberId: "kid", date: "2026-09-16" });
    expect(p.ratio).toBe(0);
  });

  describe("streak", () => {
    const day = (done: number, total: number): DailyProgress => ({
      done,
      total,
      starsEarned: done,
      starsPossible: total,
      ratio: total ? done / total : 0,
    });

    it("counts consecutive fully-completed days", () => {
      const m = new Map([
        ["2026-09-16", day(3, 3)],
        ["2026-09-15", day(3, 3)],
        ["2026-09-14", day(2, 3)],
        ["2026-09-13", day(3, 3)],
      ]);
      expect(currentStreak(m, "2026-09-16")).toBe(2);
    });

    it("does not break the streak for an unfinished today", () => {
      const m = new Map([
        ["2026-09-16", day(1, 3)],
        ["2026-09-15", day(3, 3)],
        ["2026-09-14", day(3, 3)],
      ]);
      expect(currentStreak(m, "2026-09-16")).toBe(2);
    });

    it("skips days with no tasks", () => {
      const m = new Map([
        ["2026-09-16", day(3, 3)],
        ["2026-09-15", day(0, 0)],
        ["2026-09-14", day(3, 3)],
      ]);
      expect(currentStreak(m, "2026-09-16")).toBe(2);
    });
  });
});

describe("rewards", () => {
  const pizza = { id: "pizza", star_cost: 40, max_per_week: 1, active: true };
  const now = new Date("2026-09-16T08:00:00Z");
  const args = { memberId: "kid", timezone: "UTC", now };

  it("blocks when the member cannot afford it", () => {
    const s = getRewardStatus({ ...args, reward: pizza, balance: 10, redemptions: [] });
    expect(s.canRedeem).toBe(false);
    expect(s.reason).toBe("insufficient_stars");
    expect(s.starsNeeded).toBe(30);
    expect(s.progress).toBe(0.25);
  });

  it("allows redemption when affordable and under the weekly limit", () => {
    const s = getRewardStatus({ ...args, reward: pizza, balance: 40, redemptions: [] });
    expect(s.canRedeem).toBe(true);
    expect(s.remainingThisWeek).toBe(1);
  });

  it("enforces the weekly limit, counting pending but not rejected", () => {
    const mk = (status: "pending" | "approved" | "rejected", requested_at: string) => ({
      reward_id: "pizza",
      member_id: "kid",
      status,
      requested_at,
    });
    const blocked = getRewardStatus({
      ...args,
      reward: pizza,
      balance: 100,
      redemptions: [mk("pending", "2026-09-15T10:00:00Z")],
    });
    expect(blocked.reason).toBe("weekly_limit_reached");
    expect(blocked.remainingThisWeek).toBe(0);

    const refunded = getRewardStatus({
      ...args,
      reward: pizza,
      balance: 100,
      redemptions: [mk("rejected", "2026-09-15T10:00:00Z")],
    });
    expect(refunded.canRedeem).toBe(true);
  });

  it("ignores redemptions from previous weeks", () => {
    const s = getRewardStatus({
      ...args,
      reward: pizza,
      balance: 100,
      redemptions: [
        { reward_id: "pizza", member_id: "kid", status: "approved", requested_at: "2026-09-13T23:00:00Z" },
      ],
    });
    expect(s.redeemedThisWeek).toBe(0);
    expect(s.canRedeem).toBe(true);
  });

  it("treats null max_per_week as unlimited", () => {
    const s = getRewardStatus({
      ...args,
      reward: { ...pizza, max_per_week: null },
      balance: 100,
      redemptions: [],
    });
    expect(s.remainingThisWeek).toBeNull();
  });

  it("picks the cheapest unaffordable reward as the next goal", () => {
    const rewards = [
      { id: "a", star_cost: 15, active: true },
      { id: "b", star_cost: 20, active: true },
      { id: "c", star_cost: 25, active: false },
    ];
    expect(nextGoal(rewards, 10)?.id).toBe("a");
    expect(nextGoal(rewards, 15)?.id).toBe("b");
    expect(nextGoal(rewards, 99)).toBeNull();
  });

  it("parses database error codes", () => {
    expect(parseRedemptionError("insufficient_stars")).toBe("insufficient_stars");
    expect(parseRedemptionError("P0001: weekly_limit_reached")).toBe("weekly_limit_reached");
    expect(parseRedemptionError("something else")).toBeNull();
    expect(parseRedemptionError(undefined)).toBeNull();
  });
});

describe("schemas", () => {
  it("applies defaults to task input", () => {
    const t = taskInputSchema.parse({
      title: "  Brush teeth ",
      time_of_day: "morning",
      start_date: "2026-09-01",
    });
    expect(t.title).toBe("Brush teeth");
    expect(t.stars).toBe(1);
    expect(t.recurrence_days).toEqual([]);
  });

  it("rejects bad weekdays and inverted date ranges", () => {
    const base = { title: "x", time_of_day: "morning", start_date: "2026-09-10" };
    expect(taskInputSchema.safeParse({ ...base, recurrence_days: [0] }).success).toBe(false);
    expect(taskInputSchema.safeParse({ ...base, recurrence_days: [1, 1] }).success).toBe(false);
    expect(taskInputSchema.safeParse({ ...base, end_date: "2026-09-01" }).success).toBe(false);
  });
});
