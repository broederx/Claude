"use client";

import { useState, type FormEvent } from "react";
import { addItem, patchItem } from "@/lib/actions";
import { euro } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { newId } from "@/lib/store";
import type { Product, ProductStatus } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, inputClass } from "@/components/ui";

const statusInfo: Record<ProductStatus, { label: string; tone: "neutral" | "accent" | "sage" | "warn" }> = {
  voorstel: { label: "Voorstel", tone: "accent" },
  goedgekeurd: { label: "Goedgekeurd", tone: "sage" },
  afgewezen: { label: "Afgewezen", tone: "warn" },
  besteld: { label: "Besteld", tone: "neutral" },
  geleverd: { label: "Geleverd", tone: "sage" },
};

const nextStatus: Partial<Record<ProductStatus, ProductStatus>> = { goedgekeurd: "besteld", besteld: "geleverd" };

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

  return (
    <div>
      <PageHeader
        title="Producten & budget"
        intro="Alle meubels, verlichting en materialen per ruimte, met prijs en levertijd. Goedgekeurde producten bestelt de studio voor je."
        action={role === "architect" && !adding && <Button onClick={() => setAdding(true)}>+ Product voorstellen</Button>}
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

      {adding && <AddProductForm projectId={project.id} rooms={project.rooms} onDone={() => setAdding(false)} />}

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
                    <ProductRow key={p.id} product={p} isClient={role === "client"} />
                  ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product: p, isClient }: { product: Product; isClient: boolean }) {
  const status = statusInfo[p.status];
  const next = nextStatus[p.status];

  return (
    <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
      <div className="h-14 w-14 shrink-0 rounded-xl" style={{ background: p.color }} aria-hidden />
      <div className="flex-1">
        <p className="font-medium">{p.name}</p>
        <p className="text-xs text-muted">
          {p.supplier} · levertijd ± {p.leadTimeWeeks} weken{p.qty > 1 && ` · ${p.qty} × ${euro(p.price)}`}
        </p>
        {p.clientNote && <p className="mt-1 text-xs text-warn">Klant: {p.clientNote}</p>}
      </div>
      <p className="font-serif text-xl md:w-32 md:text-right">{euro(p.price * p.qty)}</p>
      <div className="flex flex-wrap items-center gap-2 md:w-64 md:justify-end">
        {isClient && p.status === "voorstel" ? (
          <>
            <Button onClick={() => patchItem("products", p.id, { status: "goedgekeurd", clientNote: undefined })}>
              Goedkeuren
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const note = window.prompt("Wat past er niet? (optioneel)") ?? "";
                patchItem("products", p.id, { status: "afgewezen", clientNote: note || undefined });
              }}
            >
              Liever niet
            </Button>
          </>
        ) : (
          <Badge tone={status.tone}>{status.label}</Badge>
        )}
        {!isClient && next && (
          <Button variant="secondary" onClick={() => patchItem("products", p.id, { status: next })}>
            Markeer als {statusInfo[next].label.toLowerCase()}
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

function AddProductForm({ projectId, rooms, onDone }: { projectId: string; rooms: string[]; onDone: () => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addItem("products", {
      id: newId(),
      projectId,
      room: String(data.get("room")),
      name: String(data.get("name")),
      supplier: String(data.get("supplier")),
      price: Number(data.get("price")),
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
        <Field label="Leverancier">
          <input name="supplier" required className={inputClass} />
        </Field>
        <Field label="Prijs per stuk incl. btw (€)">
          <input name="price" type="number" min="0" step="0.01" required className={inputClass} />
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
