"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { addItem, patchItem } from "@/lib/actions";
import { euro } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { newId } from "@/lib/store";
import type { Product, ProductStatus, Supplier } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";

const statusInfo: Record<ProductStatus, { label: string; tone: "neutral" | "accent" | "sage" | "warn" }> = {
  voorstel: { label: "Voorstel", tone: "accent" },
  goedgekeurd: { label: "Goedgekeurd", tone: "sage" },
  afgewezen: { label: "Afgewezen", tone: "warn" },
  besteld: { label: "Besteld", tone: "neutral" },
  geleverd: { label: "Geleverd", tone: "sage" },
};


export default function ProductenPage() {
  const { project, state, role, scoped } = useProject();
  const [adding, setAdding] = useState(false);
  if (!project) return null;

  const products = scoped(state.products);
  const sum = (filter: (p: Product) => boolean) =>
    products.filter(filter).reduce((total, p) => total + p.price * p.qty, 0);
  const approved = sum((p) => ["goedgekeurd", "besteld", "geleverd"].includes(p.status));
  const proposed = sum((p) => p.status === "voorstel");
  const remaining = project.budget - approved - proposed;
  const rooms = project.rooms.filter((r) => products.some((p) => p.room === r));
  const isStudio = role === "architect";
  const margin = products
    .filter((p) => ["goedgekeurd", "besteld", "geleverd"].includes(p.status))
    .reduce((total, p) => total + (p.price - p.purchasePrice) * p.qty, 0);

  return (
    <div>
      <PageHeader
        title="Producten & budget"
        intro="Alle meubels, verlichting en materialen per ruimte, met prijs en levertijd. Goedgekeurde producten bestelt de studio voor je."
        action={isStudio && !adding && <Button onClick={() => setAdding(true)}>+ Product voorstellen</Button>}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Budget", value: project.budget },
          { label: "Goedgekeurd", value: approved },
          { label: "In voorstel", value: proposed },
          { label: "Nog beschikbaar", value: remaining },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-muted">{stat.label}</p>
            <p className={`mt-1 font-serif text-2xl ${stat.value < 0 ? "text-warn" : ""}`}>{euro(stat.value)}</p>
          </Card>
        ))}
      </div>

      {isStudio && (
        <p className="-mt-4 mb-8 text-sm text-muted">
          Alleen zichtbaar voor de studio: marge op goedgekeurde producten {euro(margin)}. Leveranciers, inkoopprijzen en
          marges ziet de klant nooit.
        </p>
      )}

      {adding && (
        <AddProductForm
          projectId={project.id}
          rooms={project.rooms}
          suppliers={state.suppliers}
          onDone={() => setAdding(false)}
        />
      )}

      {products.length === 0 ? (
        <Empty>Nog geen producten voorgesteld.</Empty>
      ) : (
        <div className="space-y-8">
          {rooms.map((room) => (
            <section key={room}>
              <h3 className="mb-3 font-serif text-2xl">{room}</h3>
              <Card className="divide-y divide-border">
                {products
                  .filter((p) => p.room === room)
                  .map((p) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      isClient={!isStudio}
                      supplier={state.suppliers.find((s) => s.id === p.supplierId)}
                    />
                  ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product: p, isClient, supplier }: { product: Product; isClient: boolean; supplier?: Supplier }) {
  const status = statusInfo[p.status];
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
      <div className="h-14 w-14 shrink-0 rounded-xl" style={{ background: p.color }} aria-hidden />
      <div className="flex-1">
        <p className="font-medium">{p.name}</p>
        <p className="text-xs text-muted">
          Levertijd ± {p.leadTimeWeeks} weken{p.qty > 1 && ` · ${p.qty} × ${euro(p.price)}`}
        </p>
        {!isClient && (
          <p className="mt-1 text-xs text-muted">
            <Link href={`/leveranciers/${p.supplierId}`} className="underline underline-offset-2 hover:text-foreground">
              {supplier?.name ?? "Onbekende leverancier"}
            </Link>{" "}
            · inkoop {euro(p.purchasePrice * p.qty)} · marge {euro((p.price - p.purchasePrice) * p.qty)}
          </p>
        )}
        {p.clientNote && <p className="mt-1 text-xs text-warn">Klant: {p.clientNote}</p>}
      </div>
      <p className="font-serif text-xl md:w-32 md:text-right">{euro(p.price * p.qty)}</p>
      <div className="flex flex-wrap items-center gap-2 md:w-64 md:justify-end">
        {isClient && p.status === "voorstel" && declining ? (
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              patchItem("products", p.id, { status: "afgewezen", clientNote: note.trim() || undefined });
            }}
          >
            <input
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Wat past er niet? (optioneel)"
              aria-label={`Waarom niet: ${p.name}`}
              className={inputClass}
            />
            <Button type="submit">Versturen</Button>
          </form>
        ) : isClient && p.status === "voorstel" ? (
          <>
            <Button onClick={() => patchItem("products", p.id, { status: "goedgekeurd", clientNote: undefined })}>
              Goedkeuren
            </Button>
            <Button
              variant="secondary"
              onClick={() => setDeclining(true)}
            >
              Liever niet
            </Button>
          </>
        ) : (
          <Badge tone={status.tone}>{status.label}</Badge>
        )}
        {!isClient && p.status === "goedgekeurd" && (
          <Link href={`/leveranciers/${p.supplierId}`} className={buttonClass("secondary")}>
            Bestellen bij {supplier?.name ?? "leverancier"}
          </Link>
        )}
        {!isClient && p.status === "besteld" && (
          <Button variant="secondary" onClick={() => patchItem("products", p.id, { status: "geleverd" })}>
            Markeer als geleverd
          </Button>
        )}
        {!isClient && p.status === "afgewezen" && (
          <Button variant="ghost" onClick={() => patchItem("products", p.id, { status: "voorstel", clientNote: undefined })}>
            Opnieuw voorstellen
          </Button>
        )}
      </div>
    </div>
  );
}

function AddProductForm({
  projectId,
  rooms,
  suppliers,
  onDone,
}: {
  projectId: string;
  rooms: string[];
  suppliers: Supplier[];
  onDone: () => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const discount = suppliers.find((s) => s.id === supplierId)?.discountPct ?? 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addItem("products", {
      id: newId(),
      projectId,
      room: String(data.get("room")),
      name: String(data.get("name")),
      supplierId,
      price: Number(data.get("price")),
      purchasePrice: Number(data.get("purchasePrice")),
      qty: Number(data.get("qty")) || 1,
      leadTimeWeeks: Number(data.get("leadTimeWeeks")) || 0,
      status: "voorstel",
      color: String(data.get("color")),
    });
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Product">
            <input name="name" required className={inputClass} />
          </Field>
        </div>
        <Field label="Ruimte">
          <select name="room" className={inputClass}>
            {rooms.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Leverancier (niet zichtbaar voor klant)">
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required className={inputClass}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prijs voor klant per stuk incl. btw (€)">
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={`Inkoopprijs incl. btw (€), ${discount}% korting`}>
          <input
            key={`${supplierId}-${price}`}
            name="purchasePrice"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={price ? (Number(price) * (1 - discount / 100)).toFixed(2) : ""}
            className={inputClass}
          />
        </Field>
        <Field label="Aantal">
          <input name="qty" type="number" min="1" defaultValue={1} className={inputClass} />
        </Field>
        <Field label="Levertijd (weken)">
          <input name="leadTimeWeeks" type="number" min="0" className={inputClass} />
        </Field>
        <Field label="Kleur/materiaal">
          <input name="color" type="color" defaultValue="#c8b9a4" className="h-10 w-full rounded-xl border border-border" />
        </Field>
        <div className="flex items-end gap-3">
          <Button type="submit">Voorstellen</Button>
          <Button variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
