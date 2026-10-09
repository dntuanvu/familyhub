import { z } from "zod";

/**
 * Zod schemas mirroring the Postgres tables (snake_case on purpose, so rows
 * from Supabase parse with no mapping layer).
 */

export const uuid = z.string().uuid();
/** Calendar date, "YYYY-MM-DD". */
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export const timestamp = z.string().datetime({ offset: true });
export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const memberRole = z.enum(["parent", "child"]);
export const timeOfDay = z.enum(["morning", "afternoon", "evening"]);
export const redemptionStatus = z.enum(["pending", "approved", "rejected"]);
export const locale = z.enum(["en", "vi"]);

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export const isoWeekday = z.number().int().min(1).max(7);
export const recurrenceDays = z
  .array(isoWeekday)
  .refine((d) => new Set(d).size === d.length, "Duplicate weekdays");

export const familySchema = z.object({
  id: uuid,
  name: z.string().min(1),
  locale,
  timezone: z.string().min(1),
  created_at: timestamp,
});

export const memberSchema = z.object({
  id: uuid,
  family_id: uuid,
  user_id: uuid.nullable(),
  name: z.string().min(1),
  avatar_emoji: z.string().min(1),
  color: hexColor,
  role: memberRole,
  created_at: timestamp,
});

export const taskSchema = z.object({
  id: uuid,
  family_id: uuid,
  title: z.string().min(1),
  icon: z.string().min(1),
  time_of_day: timeOfDay,
  stars: z.number().int().min(0),
  assignee_id: uuid.nullable(),
  recurrence_days: recurrenceDays,
  start_date: dateString,
  end_date: dateString.nullable(),
  active: z.boolean(),
  sort_order: z.number().int(),
  created_at: timestamp,
});

export const taskCompletionSchema = z.object({
  id: uuid,
  family_id: uuid,
  task_id: uuid,
  member_id: uuid,
  completed_on: dateString,
  completed_by: uuid.nullable(),
  stars_awarded: z.number().int().min(0),
  created_at: timestamp,
});

export const rewardSchema = z.object({
  id: uuid,
  family_id: uuid,
  title: z.string().min(1),
  icon: z.string().min(1),
  star_cost: z.number().int().positive(),
  max_per_week: z.number().int().positive().nullable(),
  active: z.boolean(),
  sort_order: z.number().int(),
  created_at: timestamp,
});

export const redemptionSchema = z.object({
  id: uuid,
  family_id: uuid,
  reward_id: uuid,
  member_id: uuid,
  stars_spent: z.number().int().min(0),
  status: redemptionStatus,
  requested_at: timestamp,
  decided_by: uuid.nullable(),
  decided_at: timestamp.nullable(),
});

export const starAdjustmentSchema = z.object({
  id: uuid,
  family_id: uuid,
  member_id: uuid,
  delta: z.number().int().refine((n) => n !== 0, "Delta must not be zero"),
  reason: z.string(),
  created_by: uuid.nullable(),
  created_at: timestamp,
});

export const eventSchema = z
  .object({
    id: uuid,
    family_id: uuid,
    title: z.string().min(1),
    starts_at: timestamp,
    ends_at: timestamp,
    all_day: z.boolean(),
    location: z.string().nullable(),
    notes: z.string().nullable(),
    color: hexColor,
    created_at: timestamp,
  })
  .refine((e) => Date.parse(e.ends_at) >= Date.parse(e.starts_at), {
    message: "ends_at must not be before starts_at",
    path: ["ends_at"],
  });

export const starBalanceSchema = z.object({
  member_id: uuid,
  family_id: uuid,
  earned: z.number().int(),
  adjusted: z.number().int(),
  spent: z.number().int(),
  balance: z.number().int(),
});

/* ---------- Input schemas (what forms submit) ---------- */

export const taskInputSchema = z
  .object({
    title: z.string().trim().min(1),
    icon: z.string().min(1).default("✅"),
    time_of_day: timeOfDay,
    stars: z.number().int().min(0).default(1),
    assignee_id: uuid.nullable().default(null),
    recurrence_days: recurrenceDays.default([]),
    start_date: dateString,
    end_date: dateString.nullable().default(null),
    sort_order: z.number().int().default(0),
  })
  .refine((t) => t.end_date === null || t.end_date >= t.start_date, {
    message: "end_date must not be before start_date",
    path: ["end_date"],
  });

export const rewardInputSchema = z.object({
  title: z.string().trim().min(1),
  icon: z.string().min(1).default("🎁"),
  star_cost: z.number().int().positive(),
  max_per_week: z.number().int().positive().nullable().default(null),
  sort_order: z.number().int().default(0),
});

/* ---------- Types ---------- */

export type MemberRole = z.infer<typeof memberRole>;
export type TimeOfDay = z.infer<typeof timeOfDay>;
export type RedemptionStatus = z.infer<typeof redemptionStatus>;
export type Locale = z.infer<typeof locale>;

export type Family = z.infer<typeof familySchema>;
export type Member = z.infer<typeof memberSchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskCompletion = z.infer<typeof taskCompletionSchema>;
export type Reward = z.infer<typeof rewardSchema>;
export type Redemption = z.infer<typeof redemptionSchema>;
export type StarAdjustment = z.infer<typeof starAdjustmentSchema>;
export type CalendarEvent = z.infer<typeof eventSchema>;
export type StarBalance = z.infer<typeof starBalanceSchema>;

export type TaskInput = z.input<typeof taskInputSchema>;
export type RewardInput = z.input<typeof rewardInputSchema>;
