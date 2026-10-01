"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { addItem, patchItem } from "@/lib/actions";
import { euro, longDate, today } from "@/lib/format";
import { newId, setAppState, useAppState } from "@/lib/store";
import type { OrderStatus, Product, PurchaseOrder } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, inputClass } from "@/components/ui";
import StudioOnly from "@/components/StudioOnly";

const orderStatus: Record<OrderStatus, { label: string; tone: "neutral" | "accent" | "sage" }> = {
  verstuurd: { label: "Verstuurd", tone: "accent" },
  bevestigd: { label: "Bevestigd", tone: "neutral" },
  geleverd: { label: "Geleverd", tone: "sage" },
};

function nextOrderNumber(orders: PurchaseOrder[]) {
  const prefix = `IO-${today().slice(0, 4)}-`;
  const highest = orders
    .filter((o) => o.number.startsWith(prefix))
    .map((o) => Number(o.number.slice(prefix.length)) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

export default function SupplierPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const state = useAppState();
  const [selected, setSelected] = useState<string[]>([]);
  const [deliverTo, setDeliverTo] = useState<PurchaseOrder["deliverTo"]>("project");

  if (state.role !== "architect") return <StudioOnly />;

  const supplier = state.suppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return (
      <p className="text-muted">
        Leverancier niet gevonden.{" "}
        <Link href="/leveranciers" className="underline">
          Terug
        </Link>
      </p>
    );
  }

  const projectName = (id: string) => state.projects.find((p) => p.id === id)?.name ?? id;
  const products = state.products.filter((p) => p.supplierId === supplier.id);
  const toOrder = products.filter((p) => p.status === "goedgekeurd");
  const orders = state.orders.filter((o) => o.supplierId === supplier.id).sort((a, b) => b.date.localeCompare(a.date));
  const totalPurchased = products
    .filter((p) => p.status === "besteld" || p.status === "geleverd")
    .reduce((sum, p) => sum + p.purchasePrice * p.qty, 0);

  // Eén order per project, zodat leveringen en kosten per project gescheiden blijven.
  function placeOrders() {
    const chosen = toOrder.filter((p) => selected.includes(p.id));
    const byProject = new Map<string, Product[]>();
    for (const p of chosen) byProject.set(p.projectId, [...(byProject.get(p.projectId) ?? []), p]);
    let all = state.orders;
    for (const [projectId, items] of byProject) {
      const order: PurchaseOrder = {
        id: newId(),
        number: nextOrderNumber(all),
        supplierId: supplier!.id,
        projectId,
        productIds: items.map((p) => p.id),
        date: today(),
        deliverTo,
        status: "verstuurd",
      };
      all = [...all, order];
      addItem("orders", order);
    }
    setAppState((s) => ({
      ...s,
      products: s.products.map((p) => (selected.includes(p.id) ? { ...p, status: "besteld" } : p)),
    }));
    setSelected([]);
  }

  function setOrderStatus(order: PurchaseOrder, status: OrderStatus) {
    patchItem("orders", order.id, { status });
    if (status === "geleverd") {
      setAppState((s) => ({
        ...s,
        products: s.products.map((p) => (order.productIds.includes(p.id) ? { ...p, status: "geleverd" } : p)),
      }));
    }
  }

  return (
    <div>
      <Link href="/leveranciers" className="text-sm text-muted hover:text-foreground">
        ← Alle leveranciers
      </Link>
      <div className="mt-4 mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{supplier.category}</p>
          <h1 className="mt-1 font-serif text-4xl font-light sm:text-5xl">{supplier.name}</h1>
        </div>
        <p className="text-sm text-muted">Totaal ingekocht {euro(totalPurchased)}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="space-y-4 p-6 text-sm lg:order-2">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Gegevens</h2>
          <dl className="space-y-3">
            {[
              ["Contactpersoon", supplier.contactName],
              ["E-mail", supplier.email],
              ["Telefoon", supplier.phone],
              ["Website", supplier.website],
              ["Dealernummer", supplier.accountNumber],
              ["Korting", `${supplier.discountPct}%`],
              ["Voorwaarden", supplier.terms],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="break-words">{value}</dd>
                </div>
              ))}
          </dl>
          <Field label="Interne notities">
            <textarea
              rows={3}
              value={supplier.notes ?? ""}
              onChange={(e) => patchItem("suppliers", supplier.id, { notes: e.target.value })}
              className={inputClass}
              placeholder="Bijv. vaste contactpersoon showroom, retourbeleid"
            />
          </Field>
        </Card>

        <div className="space-y-8 lg:order-1 lg:col-span-2">
          <section>
            <h2 className="mb-3 font-serif text-2xl">Te bestellen</h2>
            {toOrder.length === 0 ? (
              <Empty>Geen goedgekeurde producten die nog besteld moeten worden.</Empty>
            ) : (
              <Card className="divide-y divide-border">
                {toOrder.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-4 px-5 py-4 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={(e) =>
                        setSelected(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))
                      }
                    />
                    <span className="flex-1">
                      <span className="block">
                        {p.qty} × {p.name}
                      </span>
                      <span className="text-xs text-muted">
                        {projectName(p.projectId)} · {p.room}
                      </span>
                    </span>
                    <span className="text-right">{euro(p.purchasePrice * p.qty)}</span>
                  </label>
                ))}
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted">
                    Leveren op
                    <select
                      value={deliverTo}
                      onChange={(e) => setDeliverTo(e.target.value as PurchaseOrder["deliverTo"])}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-foreground"
                    >
                      <option value="project">Projectadres</option>
                      <option value="studio">Studio</option>
                    </select>
                  </label>
                  <Button disabled={selected.length === 0} onClick={placeOrders}>
                    Inkooporder versturen ({selected.length})
                  </Button>
                </div>
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl">Inkooporders</h2>
            {orders.length === 0 ? (
              <Empty>Nog geen orders bij deze leverancier.</Empty>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => {
                  const items = state.products.filter((p) => o.productIds.includes(p.id));
                  const status = orderStatus[o.status];
                  return (
                    <Card key={o.id} className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium">
                            {o.number} · {projectName(o.projectId)}
                          </p>
                          <p className="text-xs text-muted">
                            Besteld {longDate(o.date)} · leveren op {o.deliverTo === "studio" ? "studio" : "projectadres"}
                            {o.expectedDelivery && ` · verwacht ${longDate(o.expectedDelivery)}`}
                          </p>
                        </div>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <ul className="mt-3 space-y-1 text-sm">
                        {items.map((p) => (
                          <li key={p.id} className="flex justify-between gap-4">
                            <span>
                              {p.qty} × {p.name}
                            </span>
                            <span className="text-muted">{euro(p.purchasePrice * p.qty)}</span>
                          </li>
                        ))}
                      </ul>
                      {o.status !== "geleverd" && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                          {o.status === "verstuurd" && (
                            <Button variant="secondary" onClick={() => setOrderStatus(o, "bevestigd")}>
                              Orderbevestiging ontvangen
                            </Button>
                          )}
                          <label className="flex items-center gap-2 text-sm text-muted">
                            Verwachte levering
                            <input
                              type="date"
                              value={o.expectedDelivery ?? ""}
                              onChange={(e) => patchItem("orders", o.id, { expectedDelivery: e.target.value || undefined })}
                              className="rounded-lg border border-border bg-background px-2 py-1 text-foreground"
                            />
                          </label>
                          <Button onClick={() => setOrderStatus(o, "geleverd")}>Geleverd</Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
