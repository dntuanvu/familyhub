// API response types — match what the NestJS/Prisma API returns (camelCase).
// We intentionally don't reuse @family-hub/core here because those zod schemas
// use snake_case for the legacy Supabase shape.

export type MemberRole = "parent" | "child";
export type TimeOfDay = "morning" | "afternoon" | "evening";
export type RedemptionStatus = "pending" | "approved" | "rejected";

export interface Family {
  id: string;
  name: string;
  locale: string;
  timezone: string;
  createdAt: string;
}

export interface Member {
  id: string;
  familyId: string;
  userId: string | null;
  name: string;
  avatarEmoji: string;
  color: string;
  role: MemberRole;
  createdAt: string;
}

export interface Task {
  id: string;
  familyId: string;
  title: string;
  icon: string;
  timeOfDay: TimeOfDay;
  stars: number;
  assigneeId: string | null;
  recurrenceDays: number[];
  startDate: string;
  endDate: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TaskCompletion {
  id: string;
  familyId: string;
  taskId: string;
  memberId: string;
  completedOn: string;
  completedBy: string | null;
  starsAwarded: number;
  createdAt: string;
}

export interface Reward {
  id: string;
  familyId: string;
  title: string;
  icon: string;
  starCost: number;
  maxPerWeek: number | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Redemption {
  id: string;
  familyId: string;
  rewardId: string;
  memberId: string;
  starsSpent: number;
  status: RedemptionStatus;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface CalendarEvent {
  id: string;
  familyId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  color: string;
  createdAt: string;
}

export interface StarBalance {
  memberId: string;
  familyId: string;
  earned: number;
  adjusted: number;
  spent: number;
  balance: number;
}

export interface Me {
  id: string;
  email: string;
  memberships: {
    memberId: string;
    familyId: string;
    role: MemberRole;
    name: string;
    family: Family;
  }[];
}
