import { isoWeekday, type DateString } from "./dates";

export interface Recurring {
  recurrence_days: number[];
  start_date: DateString;
  end_date: DateString | null;
  active: boolean;
}

/** Is this task scheduled on `date`? Empty recurrence_days means every day. */
export function isTaskDueOn(task: Recurring, date: DateString): boolean {
  if (!task.active) return false;
  if (date < task.start_date) return false;
  if (task.end_date !== null && date > task.end_date) return false;
  if (task.recurrence_days.length === 0) return true;
  return task.recurrence_days.includes(isoWeekday(date));
}

export function tasksDueOn<T extends Recurring>(tasks: T[], date: DateString): T[] {
  return tasks.filter((t) => isTaskDueOn(t, date));
}

/** Tasks due on `date` for one member (unassigned tasks count for everyone). */
export function tasksForMemberOn<T extends Recurring & { assignee_id: string | null }>(
  tasks: T[],
  memberId: string,
  date: DateString,
): T[] {
  return tasksDueOn(tasks, date).filter(
    (t) => t.assignee_id === null || t.assignee_id === memberId,
  );
}
