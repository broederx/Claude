"use client";

import { useState, type FormEvent } from "react";
import { addItem, patchItem, removeItem } from "@/lib/actions";
import { contractorCanSee } from "@/lib/docs";
import { useAppState } from "@/lib/store";
import { Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import StudioOnly from "@/components/StudioOnly";

export default function UitvoerdersPage() {
  const state = useAppState();
  const [adding, setAdding] = useState(false);

  if (state.role !== "architect") return <StudioOnly />;

  const contractors = [...state.contractors].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader
        title="Uitvoerders"
        intro="Aannemers, schilders, elektriciens en andere vakmensen. Een uitvoerder ziet alleen de documenten en tekeningen die je bij een project als definitief aanmerkt, en alleen van de projecten die je hier aanvinkt."
        action={!adding && <Button onClick={() => setAdding(true)}>+ Uitvoerder toevoegen</Button>}
      />

      {adding && <AddContractorForm onDone={() => setAdding(false)} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {contractors.map((c) => (
          <Card key={c.id} className="space-y-4 p-6">
            <div>
              <h3 className="font-serif text-2xl">{c.name}</h3>
              <p className="text-sm text-muted">
                {c.trade} · {c.contactName}
              </p>
              <p className="text-sm text-muted">
                {c.email} · {c.phone}
              </p>
            </div>
            <fieldset className="space-y-2 border-t border-border pt-4">
              <legend className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Toegang tot projecten</legend>
              {state.projects.map((p) => {
                const shared = state.docs.filter((d) => d.projectId === p.id && contractorCanSee(d)).length;
                return (
                  <label key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={c.projectIds.includes(p.id)}
                        onChange={(e) =>
                          patchItem("contractors", c.id, {
                            projectIds: e.target.checked
                              ? [...c.projectIds, p.id]
                              : c.projectIds.filter((id) => id !== p.id),
                          })
                        }
                      />
                      {p.name}
                    </span>
                    <span className="text-xs text-muted">
                      {shared} {shared === 1 ? "definitief document" : "definitieve documenten"}
                    </span>
                  </label>
                );
              })}
            </fieldset>
            <button type="button" onClick={() => removeItem("contractors", c.id)} className="text-xs text-muted hover:text-warn">
              Verwijderen
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddContractorForm({ onDone }: { onDone: () => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name"));
    addItem("contractors", {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36).slice(-4)}`,
      name,
      trade: String(data.get("trade")) || "Uitvoerder",
      contactName: String(data.get("contactName")),
      email: String(data.get("email")),
      phone: String(data.get("phone")),
      projectIds: [],
    });
    onDone();
  }

  return (
    <Card className="mb-8 p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Bedrijfsnaam">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Vak">
          <input name="trade" list="contractor-trades" className={inputClass} placeholder="Aannemer, schilder…" />
          <datalist id="contractor-trades">
            {["Aannemer", "Schilder & stucwerk", "Elektricien", "Installateur", "Tegelzetter", "Vloerenlegger", "Meubelmaker", "Stoffeerder"].map(
              (t) => (
                <option key={t} value={t} />
              ),
            )}
          </datalist>
        </Field>
        <Field label="Contactpersoon">
          <input name="contactName" className={inputClass} />
        </Field>
        <Field label="E-mail (hiermee logt de uitvoerder in)">
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Telefoon">
          <input name="phone" className={inputClass} />
        </Field>
        <div className="flex items-end gap-3">
          <Button type="submit">Opslaan</Button>
          <Button variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
