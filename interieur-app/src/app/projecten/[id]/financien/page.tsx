"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { addItem } from "@/lib/actions";
import { addDays, euro, invoiceTotals, longDate, today } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { newId } from "@/lib/store";
import { studio } from "@/lib/studio";
import type { Invoice, InvoiceLine } from "@/lib/types";
import { Button, Card, Empty, Field, PageHeader, inputClass } from "@/components/ui";
import { InvoiceStatusBadge } from "./status";

export default function FinancienPage() {
  const { project, state, role, scoped } = useProject();
  const [creating, setCreating] = useState(false);
  if (!project) return null;

  // Klanten zien geen concepten.
  const all = scoped(state.invoices)
    .filter((i) => role === "architect" || i.status !== "concept")
    .sort((a, b) => b.date.localeCompare(a.date));
  const facturen = all.filter((i) => i.kind === "factuur");
  const sumBy = (list: Invoice[]) => list.reduce((s, i) => s + invoiceTotals(i).total, 0);
  const paid = sumBy(facturen.filter((i) => i.status === "betaald"));
  const open = sumBy(facturen.filter((i) => i.status === "verzonden"));
  const agreed = sumBy(all.filter((i) => i.kind === "offerte" && i.status === "geaccepteerd"));

  return (
    <div>
      <PageHeader
        title="Offertes & facturen"
        intro="Overzicht van het honorarium: wat is afgesproken, wat is betaald en wat staat nog open."
        action={role === "architect" && !creating && <Button onClick={() => setCreating(true)}>+ Nieuwe offerte of factuur</Button>}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Afgesproken (offertes)", value: agreed },
          { label: "Betaald", value: paid },
          { label: "Openstaand", value: open },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-muted">{s.label}</p>
            <p className="mt-1 font-serif text-2xl">{euro(s.value)}</p>
          </Card>
        ))}
      </div>

      {creating && <NewInvoiceForm projectId={project.id} existing={state.invoices} onCancel={() => setCreating(false)} />}

      {all.length === 0 ? (
        <Empty>Nog geen offertes of facturen.</Empty>
      ) : (
        <Card className="divide-y divide-border">
          {all.map((inv) => (
            <Link
              key={inv.id}
              href={`/projecten/${project.id}/financien/${inv.id}`}
              className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-background sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <p className="font-medium">
                  {inv.kind === "offerte" ? "Offerte" : "Factuur"} {inv.number}
                </p>
                <p className="text-xs text-muted">
                  {inv.lines[0]?.description}
                  {inv.lines.length > 1 && ` + ${inv.lines.length - 1} regel(s)`} · {longDate(inv.date)}
                </p>
              </div>
              <InvoiceStatusBadge invoice={inv} />
              <p className="font-serif text-xl sm:w-36 sm:text-right">{euro(invoiceTotals(inv).total)}</p>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}

function nextNumber(existing: Invoice[], kind: Invoice["kind"]) {
  const year = today().slice(0, 4);
  const prefix = kind === "offerte" ? `OF-${year}-` : `${year}-`;
  const highest = existing
    .filter((i) => i.kind === kind && i.number.startsWith(prefix))
    .map((i) => Number(i.number.slice(prefix.length)) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

function NewInvoiceForm({ projectId, existing, onCancel }: { projectId: string; existing: Invoice[]; onCancel: () => void }) {
  const router = useRouter();
  const [kind, setKind] = useState<Invoice["kind"]>("factuur");
  const [lines, setLines] = useState<InvoiceLine[]>([{ description: "", qty: 1, unitPrice: 0 }]);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  function updateLine(index: number, changes: Partial<InvoiceLine>) {
    setLines(lines.map((line, i) => (i === index ? { ...line, ...changes } : line)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const send = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "send";
    const id = newId();
    const date = today();
    addItem("invoices", {
      id,
      projectId,
      kind,
      number: nextNumber(existing, kind),
      date,
      dueDate: addDays(date, kind === "offerte" ? 30 : studio.paymentTermDays),
      status: send ? "verzonden" : "concept",
      vatRate: 21,
      lines: lines.filter((l) => l.description.trim()),
    });
    router.push(`/projecten/${projectId}/financien/${id}`);
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(["factuur", "offerte"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-full border px-3 py-1 text-sm capitalize ${
                kind === k ? "border-foreground bg-foreground text-background" : "border-border text-muted"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        {lines.map((line, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[1fr_6rem_9rem]">
            <Field label={i === 0 ? "Omschrijving" : ""}>
              <input
                required={i === 0}
                value={line.description}
                onChange={(e) => updateLine(i, { description: e.target.value })}
                className={inputClass}
                placeholder="Bijv. Termijn 3: begeleiding uitvoering"
              />
            </Field>
            <Field label={i === 0 ? "Aantal" : ""}>
              <input
                type="number"
                min="0"
                step="0.5"
                value={line.qty}
                onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label={i === 0 ? "Prijs excl. btw" : ""}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
        ))}
        <Button variant="ghost" onClick={() => setLines([...lines, { description: "", qty: 1, unitPrice: 0 }])}>
          + Regel toevoegen
        </Button>
        <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Subtotaal {euro(subtotal)} · btw 21% {euro(subtotal * 0.21)} ·{" "}
            <span className="text-foreground">totaal {euro(subtotal * 1.21)}</span>
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onCancel}>
              Annuleren
            </Button>
            <Button type="submit" variant="secondary" value="draft">
              Opslaan als concept
            </Button>
            <Button type="submit" value="send">
              Versturen naar klant
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
