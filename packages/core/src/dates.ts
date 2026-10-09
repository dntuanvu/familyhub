/**
 * Date helpers working on "YYYY-MM-DD" strings.
 *
 * All arithmetic goes through UTC so it is immune to device timezone and DST.
 * To turn an instant into the family's local calendar date, use
 * `toDateStringInTz`.
 */

export type DateString = string;

const MS_PER_DAY = 86_400_000;

function parse(d: DateString): Date {
  const [y, m, day] = d.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, day));
}

function format(dt: Date): DateString {
  return dt.toISOString().slice(0, 10);
}

export function addDays(d: DateString, n: number): DateString {
  return format(new Date(parse(d).getTime() + n * MS_PER_DAY));
}

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(d: DateString): number {
  const js = parse(d).getUTCDay(); // 0 = Sunday
  return js === 0 ? 7 : js;
}

/** First day of the week containing `d`. 1 = Monday-first, 7 = Sunday-first. */
export function startOfWeek(d: DateString, weekStartsOn: 1 | 7 = 1): DateString {
  const wd = isoWeekday(d);
  const back = weekStartsOn === 1 ? wd - 1 : wd % 7;
  return addDays(d, -back);
}

export function weekDates(d: DateString, weekStartsOn: 1 | 7 = 1): DateString[] {
  const start = startOfWeek(d, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** The calendar date of an instant as seen in `timeZone` (IANA name). */
export function toDateStringInTz(instant: Date | string, timeZone: string): DateString {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
