"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { addItem } from "@/lib/actions";
import { useAppState } from "@/lib/store";
import type { Supplier } from "@/lib/types";
import { Badge, Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import StudioOnly from "@/components/StudioOnly";

export default function LeveranciersPage() {
  const state = useAppState();
  const [category, setCategory] = useState("Alle");
  const [adding, setAdding] = useState(false);

  if (state.role !== "architect") return <StudioOnly />;

  const categories = ["Alle", ...new Set(state.suppliers.map((s) => s.category))];
  const suppliers = state.suppliers
    .filter((s) => category === "Alle" || s.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader
        title="Leveranciers"
        intro="Je leveranciers, kortingen en inkooporders, los van de klantkant. Klanten zien nooit bij wie je inkoopt of tegen welke prijs."
        action={!adding && <Button onClick={() => setAdding(true)}>+ Leverancier toevoegen</Button>}
      />

      {adding && <AddSupplierForm onDone={() => setAdding(false)} />}

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-sm ${
              category === c ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => {
          const toOrder = state.products.filter((p) => p.supplierId === s.id && p.status === "goedgekeurd").length;
          const openOrders = state.orders.filter((o) => o.supplierId === s.id && o.status !== "geleverd").length;
          return (
            <Link key={s.id} href={`/leveranciers/${s.id}`} className="group">
              <Card className="flex h-full flex-col gap-4 p-6 transition-shadow group-hover:shadow-lg group-hover:shadow-foreground/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl">{s.name}</h3>
                    <p className="text-sm text-muted">{s.category}</p>
                  </div>
                  <Badge>{s.discountPct}% korting</Badge>
                </div>
                <p className="text-sm text-muted">
                  {s.contactName}
                  <br />
                  {s.email}
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {toOrder > 0 && <Badge tone="accent">{toOrder} te bestellen</Badge>}
                  {openOrders > 0 && <Badge>{openOrders} lopende order{openOrders > 1 ? "s" : ""}</Badge>}
                  {toOrder === 0 && openOrders === 0 && <span className="text-xs text-muted">Niets openstaand</span>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AddSupplierForm({ onDone }: { onDone: () => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name"));
    const supplier: Supplier = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36).slice(-4)}`,
      name,
      category: String(data.get("category")) || "Overig",
      contactName: String(data.get("contactName")),
      email: String(data.get("email")),
      phone: String(data.get("phone")),
      website: String(data.get("website")) || undefined,
      accountNumber: String(data.get("accountNumber")) || undefined,
      discountPct: Number(data.get("discountPct")) || 0,
      terms: String(data.get("terms")) || undefined,
    };
    addItem("suppliers", supplier);
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Naam">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Categorie">
          <input name="category" list="supplier-categories" className={inputClass} placeholder="Meubels, Verlichting…" />
          <datalist id="supplier-categories">
            {["Meubels", "Verlichting", "Sanitair", "Vloeren", "Textiel", "Verf & stuc", "Maatwerk", "Accessoires"].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Korting (%)">
          <input name="discountPct" type="number" min="0" max="100" className={inputClass} />
        </Field>
        <Field label="Contactpersoon">
          <input name="contactName" className={inputClass} />
        </Field>
        <Field label="E-mail voor orders">
          <input name="email" type="email" className={inputClass} />
        </Field>
        <Field label="Telefoon">
          <input name="phone" className={inputClass} />
        </Field>
        <Field label="Website">
          <input name="website" className={inputClass} />
        </Field>
        <Field label="Klant- of dealernummer">
          <input name="accountNumber" className={inputClass} />
        </Field>
        <Field label="Voorwaarden">
          <input name="terms" className={inputClass} placeholder="Levertijd, aanbetaling, franco…" />
        </Field>
        <div className="flex gap-3">
          <Button type="submit">Opslaan</Button>
          <Button variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
