export type ISODate = string;

export function nowIso(): ISODate {
  return new Date().toISOString();
}

export function addDaysIso(base: ISODate, days: number): ISODate {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}
