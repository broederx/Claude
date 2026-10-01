import type { Invoice, Phase } from "./types";

const euroFormat = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const dateFormat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" });
const timeFormat = new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" });

export const euro = (value: number) => euroFormat.format(value);
export const longDate = (iso: string) => dateFormat.format(new Date(iso));
export const shortDate = (iso: string) => shortDateFormat.format(new Date(iso));
export const time = (iso: string) => timeFormat.format(new Date(iso));

export function fileSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1).replace(".", ",")} MB` : `${kb} kB`;
}

export const phases: { id: Phase; label: string; description: string }[] = [
  { id: "kennismaking", label: "Kennismaking", description: "Eerste gesprek, opname en voorstel" },
  { id: "pve", label: "Wensen", description: "Programma van eisen en moodboard" },
  { id: "schetsontwerp", label: "Schetsontwerp", description: "Indeling, sfeer en eerste keuzes" },
  { id: "definitief", label: "Definitief ontwerp", description: "Tekeningen, materialen en producten" },
  { id: "uitvoering", label: "Uitvoering", description: "Bouw, bestellingen en leveringen" },
  { id: "oplevering", label: "Oplevering", description: "Styling en nazorg" },
];

export function phaseIndex(phase: Phase) {
  return phases.findIndex((p) => p.id === phase);
}

export function invoiceTotals(invoice: Invoice) {
  const subtotal = invoice.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
  const vat = Math.round(subtotal * invoice.vatRate) / 100;
  return { subtotal, vat, total: subtotal + vat };
}

export function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
