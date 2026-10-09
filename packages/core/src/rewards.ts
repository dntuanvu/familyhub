import { startOfWeek, toDateStringInTz } from "./dates";

export const RedemptionErrorCode = {
  InsufficientStars: "insufficient_stars",
  WeeklyLimitReached: "weekly_limit_reached",
  RewardInactive: "reward_inactive",
  AlreadyDecided: "redemption_already_decided",
} as const;
export type RedemptionErrorCode = (typeof RedemptionErrorCode)[keyof typeof RedemptionErrorCode];

const KNOWN_CODES = new Set<string>(Object.values(RedemptionErrorCode));

/** Extract our stable error code from a Postgres/Supabase error message. */
export function parseRedemptionError(message: string | undefined | null): RedemptionErrorCode | null {
  if (!message) return null;
  for (const code of KNOWN_CODES) {
    if (message.includes(code)) return code as RedemptionErrorCode;
  }
  return null;
}

export type BlockReason = "inactive" | "insufficient_stars" | "weekly_limit_reached";

export interface RewardStatus {
  redeemedThisWeek: number;
  /** null = unlimited */
  remainingThisWeek: number | null;
  affordable: boolean;
  canRedeem: boolean;
  reason: BlockReason | null;
  starsNeeded: number;
  /** balance / cost, clamped to 0..1 (for progress bars) */
  progress: number;
}

export function getRewardStatus(args: {
  reward: { id: string; star_cost: number; max_per_week: number | null; active: boolean };
  memberId: string;
  balance: number;
  redemptions: {
    reward_id: string;
    member_id: string;
    status: "pending" | "approved" | "rejected";
    requested_at: string;
  }[];
  now: Date;
  timezone: string;
  weekStartsOn?: 1 | 7;
}): RewardStatus {
  const { reward, memberId, balance, redemptions, now, timezone, weekStartsOn = 1 } = args;

  const weekStart = startOfWeek(toDateStringInTz(now, timezone), weekStartsOn);
  const redeemedThisWeek = redemptions.filter(
    (r) =>
      r.reward_id === reward.id &&
      r.member_id === memberId &&
      r.status !== "rejected" &&
      toDateStringInTz(r.requested_at, timezone) >= weekStart,
  ).length;

  const remainingThisWeek =
    reward.max_per_week === null ? null : Math.max(0, reward.max_per_week - redeemedThisWeek);

  const affordable = balance >= reward.star_cost;

  let reason: BlockReason | null = null;
  if (!reward.active) reason = "inactive";
  else if (remainingThisWeek === 0) reason = "weekly_limit_reached";
  else if (!affordable) reason = "insufficient_stars";

  return {
    redeemedThisWeek,
    remainingThisWeek,
    affordable,
    canRedeem: reason === null,
    reason,
    starsNeeded: Math.max(0, reward.star_cost - balance),
    progress: Math.min(1, Math.max(0, balance / reward.star_cost)),
  };
}

/** The cheapest active reward the member can't afford yet (for the progress bar). */
export function nextGoal<T extends { star_cost: number; active: boolean }>(
  rewards: T[],
  balance: number,
): T | null {
  const candidates = rewards
    .filter((r) => r.active && r.star_cost > balance)
    .sort((a, b) => a.star_cost - b.star_cost);
  return candidates[0] ?? null;
}
