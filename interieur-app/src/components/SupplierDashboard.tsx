"use client";

import { useState } from "react";
import { openActions, patchItem } from "@/lib/actions";
import { docCategories, supplierDocs } from "@/lib/docs";
import { euro, fileSize, longDate, today } from "@/lib/format";
import { setAppState, useAppState } from "@/lib/store";
import { studio } from "@/lib/studio";
import type { OrderStatus, PurchaseOrder, Supplier } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, inputClass } from "@/components/ui";
import OrderThread from "@/components/OrderThread";

const statusInfo: Record<OrderStatus, { label: string; tone: "accent" | "neutral" | "sage" }> = {
  verstuurd: { label: "Nieuw", tone: "accent" },
  bevestigd: { label: "Bevestigd", tone: "neutral" },
  geleverd: { label: "Geleverd", tone: "sage" },
};

// Het portaal voor een leverancier. Toont alleen de eigen orders van de studio,
// zonder klantnamen, verkoopprijzen of marges.
export default function SupplierDashboard() {
  const state = useAppState();
  const [filter, setFilter] = useState<"open" | "geleverd">("open");
  const supplier = state.suppliers.find((s) => s.id === state.supplierView);

  if (!supplier) return <Empty>Geen leverancier gekozen.</Empty>;

  const orders = state.orders
    .filter((o) => o.supplierId === supplier.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const shown = orders.filter((o) => (filter === "open" ? o.status !== "geleverd" : o.status === "geleverd"));
  const orderValue = (o: PurchaseOrder) =>
    state.products.filter((p) => o.productIds.includes(p.id)).reduce((sum, p) => sum + p.purchasePrice * p.qty, 0);
  const year = today().slice(0, 4);
  const actions = openActions(state, "supplier");

  return (
    <div className="space-y-12">
      <section>
        <p className="text-xs uppercase tracking-[0.25em] text-muted">Leveranciersportaal {studio.name}</p>
        <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Welkom, {supplier.name}</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Hier vind je alle orders van {studio.name}. Bevestig nieuwe orders, geef leverdata door en stel je vragen
          per order.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Nieuwe orders", value: String(orders.filter((o) => o.status === "verstuurd").length) },
          { label: "In behandeling", value: String(orders.filter((o) => o.status === "bevestigd").length) },
          {
            label: `Orderwaarde ${year}`,
            value: euro(orders.filter((o) => o.date.startsWith(year)).reduce((sum, o) => sum + orderValue(o), 0)),
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-muted">{stat.label}</p>
            <p className="mt-1 font-serif text-2xl">{stat.value}</p>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">Te doen</h2>
        {actions.length === 0 ? (
          <Card className="p-6 text-sm text-muted">Alles is bijgewerkt.</Card>
        ) : (
          <Card className="divide-y divide-border">
            {actions.map((a, i) => (
              <a
                key={`${a.href}-${i}`}
                href={a.href}
                onClick={(e) => {
                  e.preventDefault();
                  setFilter("open");
                  requestAnimationFrame(() =>
                    document.getElementById(a.href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  );
                }}
                className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-background"
              >
                <span>{a.label}</span>
                <span className="text-muted">↓</span>
              </a>
            ))}
          </Card>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl">Orders</h2>
            <div className="flex rounded-full border border-border p-0.5 text-sm">
              {(["open", "geleverd"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`rounded-full px-3 py-1 ${filter === f ? "bg-foreground text-background" : "text-muted"}`}
                >
                  {f === "open" ? "Lopend" : "Geleverd"}
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 ? (
            <Empty>{filter === "open" ? "Geen lopende orders." : "Nog niets geleverd."}</Empty>
          ) : (
            <div className="space-y-4">
              {shown.map((o) => (
                <OrderCard key={o.id} order={o} value={orderValue(o)} />
              ))}
            </div>
          )}
        </section>

        <div className="space-y-8">
          <SupplierDocuments supplierId={supplier.id} />
          <CompanyDetails supplier={supplier} />
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order: o, value }: { order: PurchaseOrder; value: number }) {
  const state = useAppState();
  const [date, setDate] = useState(o.expectedDelivery ?? "");
  const items = state.products.filter((p) => o.productIds.includes(p.id));
  const project = state.projects.find((p) => p.id === o.projectId);
  const address = o.deliverTo === "studio" ? `${studio.name}, ${studio.address}` : project?.address ?? "Volgt";
  const status = statusInfo[o.status];

  function markDelivered() {
    patchItem("orders", o.id, { status: "geleverd" });
    setAppState((s) => ({
      ...s,
      products: s.products.map((p) => (o.productIds.includes(p.id) ? { ...p, status: "geleverd" } : p)),
    }));
  }

  return (
    <Card id={o.id} className="scroll-mt-6 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">Order {o.number}</p>
          <p className="text-xs text-muted">Ontvangen {longDate(o.date)}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <table className="mt-4 w-full text-sm">
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="py-2 pr-3">
                {p.qty} × {p.name}
              </td>
              <td className="py-2 text-right whitespace-nowrap text-muted">{euro(p.purchasePrice * p.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-right text-sm">Totaal {euro(value)}</p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Afleveradres</dt>
          <dd>{address}</dd>
        </div>
        <div>
          <dt className="text-muted">Verwachte levering</dt>
          <dd>{o.expectedDelivery ? longDate(o.expectedDelivery) : "Nog niet doorgegeven"}</dd>
        </div>
      </dl>

      {o.status !== "geleverd" && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Leverdatum
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-foreground"
            />
          </label>
          {o.status === "verstuurd" ? (
            <Button
              disabled={!date}
              onClick={() => patchItem("orders", o.id, { status: "bevestigd", expectedDelivery: date })}
            >
              Order bevestigen
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                disabled={!date || date === o.expectedDelivery}
                onClick={() => patchItem("orders", o.id, { expectedDelivery: date })}
              >
                Leverdatum wijzigen
              </Button>
              <Button onClick={markDelivered}>Geleverd melden</Button>
            </>
          )}
        </div>
      )}

      <OrderThread order={o} role="supplier" counterpart={studio.name} />
    </Card>
  );
}

function SupplierDocuments({ supplierId }: { supplierId: string }) {
  const state = useAppState();
  const [open, setOpen] = useState<string | null>(null);
  const groups = supplierDocs(state, supplierId).filter((g) => g.docs.length > 0);

  return (
    <Card className="h-fit space-y-4 p-6">
      <div>
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Definitieve documentatie</h2>
        <p className="mt-1 text-sm text-muted">Goedgekeurde tekeningen en impressies bij je orders.</p>
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted">Er is nog geen definitieve documentatie gedeeld.</p>
      ) : (
        groups.map((group) => (
          <div key={group.orderNumbers.join()} className="space-y-2">
            <p className="text-xs text-muted">Bij order {group.orderNumbers.join(", ")}</p>
            <ul className="space-y-2">
              {group.docs.map((doc) => (
                <li key={doc.id} className="rounded-xl border border-border p-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setOpen(open === doc.id ? null : doc.id)}
                    aria-expanded={open === doc.id}
                    className="w-full text-left"
                  >
                    <span className="block font-medium">{doc.title}</span>
                    <span className="text-xs text-muted">
                      {docCategories[doc.category]} · versie {doc.version} · {fileSize(doc.sizeKb)} · {longDate(doc.uploadedAt)}
                    </span>
                  </button>
                  {open === doc.id && (
                    <p className="mt-2 text-xs text-muted">In de echte app opent of download je hier {doc.fileName}.</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </Card>
  );
}

function CompanyDetails({ supplier }: { supplier: Supplier }) {
  const update = (changes: Partial<Supplier>) => patchItem("suppliers", supplier.id, changes);

  return (
    <Card className="h-fit space-y-4 p-6">
      <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Jouw gegevens bij {studio.name}</h2>
      <Field label="Contactpersoon">
        <input value={supplier.contactName} onChange={(e) => update({ contactName: e.target.value })} className={inputClass} />
      </Field>
      <Field label="E-mail voor orders">
        <input type="email" value={supplier.email} onChange={(e) => update({ email: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Telefoon">
        <input value={supplier.phone} onChange={(e) => update({ phone: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Leveringsvoorwaarden">
        <textarea rows={3} value={supplier.terms ?? ""} onChange={(e) => update({ terms: e.target.value })} className={inputClass} />
      </Field>
      <p className="text-sm text-muted">
        Afgesproken korting: {supplier.discountPct}%. Neem contact op met {studio.email} om dit te wijzigen.
      </p>
    </Card>
  );
}
