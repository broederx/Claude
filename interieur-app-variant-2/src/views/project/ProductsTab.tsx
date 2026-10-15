"use client";

import { useState, type FormEvent } from "react";
import { productFields, productVisible } from "@/lib/access";
import { addItem, audit, patchItem, setProductStatus } from "@/lib/actions";
import { euro, longDate, newId } from "@/lib/format";
import { partyLabel, productStatus } from "@/lib/labels";
import { useProjectData } from "@/lib/session";
import type { Product } from "@/lib/types";
import { Badge, Button, Card, Empty, Field, PageHeader, Toggle, inputClass } from "@/components/ui";
import Thread from "@/components/Thread";

export default function ProductsTab({ projectId }: { projectId: string }) {
  const { state, user, project, scoped } = useProjectData(projectId);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const products = scoped(state.products).filter((p) => productVisible(user, p));
  const isOwner = user.role === "owner";
  const rooms = project.rooms.filter((r) => products.some((p) => p.room === r));

  return (
    <div>
      <PageHeader
        title={user.role === "contractor" ? "Materialen" : "Producten"}
        intro={
          isOwner
            ? "Alle producten met per veld wie wat ziet. Inkoopprijs, marge en interne notities zijn altijd alleen voor de studio."
            : user.role === "contractor"
              ? "De materialen en producten die jij verwerkt of monteert. Alleen goedgekeurde producten staan hier."
              : "Alle voorgestelde en gekozen producten, met prijs en levertijd. Keur goed of stel een vraag bij het product."
        }
        action={isOwner && !adding && <Button onClick={() => setAdding(true)}>+ Product voorstellen</Button>}
      />
      {adding && <NewProductForm projectId={projectId} rooms={project.rooms} onDone={() => setAdding(false)} />}
      {products.length === 0 ? (
        <Empty>Geen producten.</Empty>
      ) : (
        <div className="space-y-8">
          {rooms.map((room) => (
            <section key={room}>
              <h3 className="mb-3 font-serif text-2xl">{room}</h3>
              <Card className="divide-y divide-border">
                {products
                  .filter((p) => p.room === room)
                  .map((p) => (
                    <ProductRow key={p.id} product={p} open={openId === p.id} onToggle={() => setOpenId(openId === p.id ? null : p.id)} />
                  ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product: p, open, onToggle }: { product: Product; open: boolean; onToggle: () => void }) {
  const { state, user } = useProjectData(p.projectId);
  const f = productFields(user, p);
  const status = productStatus[p.status];
  const isOwner = user.role === "owner";
  const comments = state.comments.filter((c) => c.targetType === "product" && c.targetId === p.id).length;

  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="h-12 w-12 shrink-0 rounded-xl" style={{ background: p.color }} aria-hidden />
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-muted">
            {p.brand}
            {f.sku && ` · ${p.sku}`}
            {f.supplier && ` · via ${p.supplierName}`} · levertijd {p.leadTimeWeeks} wk
            {p.expectedDelivery && ` · verwacht ${longDate(p.expectedDelivery)}`}
            {comments > 0 && ` · ${comments} bericht${comments > 1 ? "en" : ""}`}
          </p>
        </button>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {f.price && <span className="font-serif text-lg tabular-nums">{euro(p.price)}</span>}
          <Badge tone={status.tone}>{status.label}</Badge>
          {isOwner && <span className="text-xs text-muted">Actie: {partyLabel[p.actionBy]}</span>}
        </div>
      </div>

      {user.role === "client" && p.status === "voorgesteld" && (
        <div className="mt-3 flex gap-2 md:pl-15">
          <Button onClick={() => setProductStatus(user, state, p.id, "goedgekeurd")}>Goedkeuren</Button>
          <Button variant="secondary" onClick={onToggle}>
            Vraag stellen
          </Button>
        </div>
      )}

      {open && (
        <div className="mt-4 grid gap-5 border-t border-border pt-4 md:grid-cols-2">
          <div className="space-y-3 text-sm">
            {(f.purchase || f.margin) && (
              <dl className="grid grid-cols-3 gap-3 rounded-xl bg-background p-3">
                <div>
                  <dt className="text-xs text-muted">Verkoop</dt>
                  <dd className="tabular-nums">{euro(p.price)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Inkoop</dt>
                  <dd className="tabular-nums">{euro(p.purchasePrice)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Marge</dt>
                  <dd className="tabular-nums">
                    {euro(p.price - p.purchasePrice)} ({Math.round(((p.price - p.purchasePrice) / p.price) * 100)}%)
                  </dd>
                </div>
              </dl>
            )}
            {f.internalNote && p.internalNote && (
              <p className="rounded-xl bg-warn/10 p-3 text-warn">Intern: {p.internalNote}</p>
            )}
            {isOwner && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-xs uppercase tracking-[0.15em] text-muted">Zichtbaarheid</p>
                <Toggle label="Zichtbaar voor klant" checked={p.visibleToClient} onChange={(v) => { patchItem("products", p.id, { visibleToClient: v }); audit(user, "aangepast", `Zichtbaarheid ${p.name}`, p.projectId); }} />
                <Toggle label="Leverancier zichtbaar voor klant" checked={p.supplierVisibleToClient} disabled={!p.visibleToClient} onChange={(v) => patchItem("products", p.id, { supplierVisibleToClient: v })} />
                <Toggle label="Zichtbaar voor uitvoerder (na goedkeuring)" checked={p.visibleToContractor} onChange={(v) => { patchItem("products", p.id, { visibleToContractor: v }); audit(user, "aangepast", `Zichtbaarheid ${p.name}`, p.projectId); }} />
                <p className="text-xs text-muted">Inkoopprijs, marge en interne notitie zijn nooit zichtbaar buiten de studio.</p>
              </div>
            )}
            {isOwner && (
              <div className="flex flex-wrap gap-2">
                {p.status === "goedgekeurd" && <Button variant="secondary" onClick={() => setProductStatus(user, state, p.id, "besteld")}>Markeer als besteld</Button>}
                {p.status === "besteld" && <Button variant="secondary" onClick={() => setProductStatus(user, state, p.id, "geleverd")}>Markeer als geleverd</Button>}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Berichten over dit product</p>
            <Thread projectId={p.projectId} targetType="product" targetId={p.id} />
          </div>
        </div>
      )}
    </div>
  );
}

function NewProductForm({ projectId, rooms, onDone }: { projectId: string; rooms: string[]; onDone: () => void }) {
  const { user } = useProjectData(projectId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    const name = String(d.get("name"));
    addItem("products", {
      id: newId(),
      projectId,
      room: String(d.get("room")),
      name,
      brand: String(d.get("brand")),
      supplierName: String(d.get("supplierName")),
      sku: String(d.get("sku")),
      price: Number(d.get("price")),
      purchasePrice: Number(d.get("purchasePrice")),
      leadTimeWeeks: Number(d.get("leadTimeWeeks")) || 0,
      status: "voorgesteld",
      actionBy: "client",
      color: String(d.get("color")),
      visibleToClient: d.get("visibleToClient") === "on",
      visibleToContractor: d.get("visibleToContractor") === "on",
      supplierVisibleToClient: false,
      internalNote: String(d.get("internalNote")) || undefined,
    });
    audit(user, "aangepast", `Product voorgesteld: ${name}`, projectId);
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
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
        <Field label="Merk">
          <input name="brand" className={inputClass} />
        </Field>
        <Field label="Leverancier (intern)">
          <input name="supplierName" className={inputClass} />
        </Field>
        <Field label="Artikelnummer">
          <input name="sku" className={inputClass} />
        </Field>
        <Field label="Verkoopprijs incl. btw (€)">
          <input name="price" type="number" min="0" required className={inputClass} />
        </Field>
        <Field label="Inkoopprijs (alleen studio)">
          <input name="purchasePrice" type="number" min="0" className={inputClass} />
        </Field>
        <Field label="Levertijd (weken)">
          <input name="leadTimeWeeks" type="number" min="0" className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Interne notitie (alleen studio)">
            <input name="internalNote" className={inputClass} />
          </Field>
        </div>
        <Field label="Kleur/materiaal">
          <input name="color" type="color" defaultValue="#c8b9a4" className="h-10 w-full rounded-xl border border-border" />
        </Field>
        <div className="flex flex-col gap-2 text-sm sm:col-span-3">
          <label className="flex items-center gap-2"><input name="visibleToClient" type="checkbox" defaultChecked /> Zichtbaar voor klant</label>
          <label className="flex items-center gap-2"><input name="visibleToContractor" type="checkbox" /> Zichtbaar voor uitvoerder (na goedkeuring)</label>
        </div>
        <div className="flex gap-3">
          <Button type="submit">Voorstellen</Button>
          <Button variant="ghost" onClick={onDone}>Annuleren</Button>
        </div>
      </form>
    </Card>
  );
}
