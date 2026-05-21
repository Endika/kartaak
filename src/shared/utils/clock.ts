export type ISODate = string;

export function nowIso(): ISODate {
  return new Date().toISOString();
}

export function addDaysIso(base: ISODate, days: number): ISODate {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export type DateKey = string;

export function todayKey(): DateKey {
  return new Date().toISOString().slice(0, 10);
}

export function dayKeyAt(offsetDays: number): DateKey {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function dateKeyFromIso(iso: ISODate): DateKey {
  return iso.slice(0, 10);
}
