"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { patchItem, removeItem } from "@/lib/actions";
import { euro, invoiceTotals, longDate } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { studio } from "@/lib/studio";
import { Button, Card } from "@/components/ui";
import { InvoiceStatusBadge } from "../status";

export default function InvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { project, state, role } = useProject();
  const [paying, setPaying] = useState(false);
  const invoice = state.invoices.find(
    (i) => i.id === invoiceId && i.projectId === project?.id && (role === "architect" || i.status !== "concept"),
  );
  if (!project) return null;

  const back = `/projecten/${project.id}/financien`;
  if (!invoice) {
    return (
      <p className="text-muted">
        Document niet gevonden. <Link href={back} className="underline">Terug</Link>
      </p>
    );
  }

  const { subtotal, vat, total } = invoiceTotals(invoice);
  const title = invoice.kind === "offerte" ? "Offerte" : "Factuur";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={back} className="text-sm text-muted hover:text-foreground">
          ← Alle offertes &amp; facturen
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            Download PDF
          </Button>
          {role === "architect" && invoice.status === "concept" && (
            <>
              <Button variant="ghost" onClick={() => removeItem("invoices", invoice.id)}>
                Verwijderen
              </Button>
              <Button onClick={() => patchItem("invoices", invoice.id, { status: "verzonden" })}>Versturen naar klant</Button>
            </>
          )}
          {role === "architect" && invoice.kind === "factuur" && invoice.status === "verzonden" && (
            <Button onClick={() => patchItem("invoices", invoice.id, { status: "betaald" })}>Markeer als betaald</Button>
          )}
          {role === "client" && invoice.kind === "offerte" && invoice.status === "verzonden" && (
            <Button onClick={() => patchItem("invoices", invoice.id, { status: "geaccepteerd" })}>Offerte accepteren</Button>
          )}
          {role === "client" && invoice.kind === "factuur" && invoice.status === "verzonden" && (
            <Button onClick={() => setPaying(true)}>Betalen met iDEAL</Button>
          )}
        </div>
      </div>

      {paying && (
        <Card className="mb-6 p-6 print:hidden">
          <p className="font-medium">Betalen: {euro(total)}</p>
          <p className="mt-1 text-sm text-muted">
            In de echte app ga je nu naar je eigen bank via iDEAL (bijvoorbeeld via Mollie). Dit is een simulatie.
          </p>
          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => {
                patchItem("invoices", invoice.id, { status: "betaald" });
                setPaying(false);
              }}
            >
              Betaling afronden
            </Button>
            <Button variant="ghost" onClick={() => setPaying(false)}>
              Annuleren
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-8 sm:p-12 print:border-0 print:p-0">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div>
            <p className="font-serif text-3xl">
              mim <span className="text-muted">|</span> interiors
            </p>
            <p className="mt-2 text-sm text-muted">
              {studio.address}
              <br />
              {studio.email} · {studio.phone}
            </p>
          </div>
          <div className="sm:text-right">
            <h2 className="font-serif text-4xl font-light">{title}</h2>
            <p className="mt-1 text-sm">{invoice.number}</p>
            <div className="mt-2 print:hidden">
              <InvoiceStatusBadge invoice={invoice} />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted">Aan</p>
            <p className="mt-1">{project.clientName}</p>
            <p className="text-muted">{project.address}</p>
          </div>
          <div className="sm:text-right">
            <p>
              <span className="text-muted">Datum: </span>
              {longDate(invoice.date)}
            </p>
            <p>
              <span className="text-muted">{invoice.kind === "offerte" ? "Geldig tot: " : "Vervaldatum: "}</span>
              {longDate(invoice.dueDate)}
            </p>
            <p>
              <span className="text-muted">Project: </span>
              {project.name}
            </p>
          </div>
        </div>

        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted">
              <th className="py-2 font-normal">Omschrijving</th>
              <th className="py-2 text-right font-normal">Aantal</th>
              <th className="py-2 text-right font-normal">Prijs</th>
              <th className="py-2 text-right font-normal">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3 pr-4">{line.description}</td>
                <td className="py-3 text-right">{line.qty.toLocaleString("nl-NL")}</td>
                <td className="py-3 text-right">{euro(line.unitPrice)}</td>
                <td className="py-3 text-right">{euro(line.qty * line.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotaal</span>
            {euro(subtotal)}
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Btw {invoice.vatRate}%</span>
            {euro(vat)}
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-serif text-xl">
            <span>Totaal</span>
            {euro(total)}
          </div>
        </div>

        <p className="mt-12 text-xs text-muted">
          {invoice.kind === "factuur"
            ? `Graag binnen ${studio.paymentTermDays} dagen overmaken naar ${studio.iban} t.n.v. ${studio.name}, o.v.v. ${invoice.number}.`
            : "Na akkoord op deze offerte starten we met de werkzaamheden volgens de overeenkomst van opdracht."}
          <br />
          KvK {studio.kvk} · btw {studio.vatId}
        </p>
      </Card>
    </div>
  );
}
