const euroFormat = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });
const weekdayFormat = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" });
const timeFormat = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" });

export const euro = (value: number) => euroFormat.format(value);
export const signedEuro = (value: number) => (value > 0 ? `+${euro(value)}` : value < 0 ? `−${euro(-value)}` : "geen meerprijs");
export const longDate = (iso: string) => dateFormat.format(new Date(iso));
export const shortDate = (iso: string) => shortDateFormat.format(new Date(iso));
export const weekday = (iso: string) => weekdayFormat.format(new Date(iso));
export const time = (iso: string) => timeFormat.format(new Date(iso));

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso() {
  return new Date().toISOString().slice(0, 19);
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso.slice(0, 10)).getTime()) / 86400000);
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}
