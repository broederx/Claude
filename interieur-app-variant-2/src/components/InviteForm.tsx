"use client";

import { useState, type FormEvent } from "react";
import { addItem, audit } from "@/lib/actions";
import { addDays, newId } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Role } from "@/lib/types";
import { Button, Field, inputClass } from "@/components/ui";

// Persoonlijke uitnodiging in plaats van een openbare link. Uitvoerders krijgen
// standaard toegang tot 30 dagen na oplevering.
export default function InviteForm({ projectId, defaultUntil }: { projectId?: string; defaultUntil?: string }) {
  const { state, user } = useSession();
  const [role, setRole] = useState<Role>(projectId ? "contractor" : "client");
  const [project, setProject] = useState(projectId ?? state.projects[0]?.id ?? "");
  const [sent, setSent] = useState("");
  const delivery = defaultUntil ?? state.projects.find((p) => p.id === project)?.deliveryDate;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    const name = String(d.get("name"));
    const company = String(d.get("company")) || undefined;
    addItem("users", {
      id: newId(),
      name,
      role,
      email: String(d.get("email")),
      company,
      trade: role === "contractor" ? String(d.get("trade")) || "Uitvoerder" : undefined,
      projectIds: role === "supplier" ? [] : [project],
      accessUntil: role === "contractor" ? String(d.get("until")) || undefined : undefined,
      twoFactor: d.get("twoFactor") === "on",
    });
    audit(user, "uitgenodigd", `${company ?? name} als ${role}`, role === "supplier" ? undefined : project);
    setSent(String(d.get("email")));
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Rol">
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
          <option value="client">Klant</option>
          <option value="contractor">Uitvoerder</option>
          <option value="supplier">Leverancier</option>
        </select>
      </Field>
      {!projectId && role !== "supplier" && (
        <Field label="Project">
          <select value={project} onChange={(e) => setProject(e.target.value)} className={inputClass}>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Naam">
        <input name="name" required className={inputClass} />
      </Field>
      <Field label="E-mail (persoonlijke uitnodiging)">
        <input name="email" type="email" required className={inputClass} />
      </Field>
      {role !== "client" && (
        <Field label="Bedrijf">
          <input name="company" className={inputClass} />
        </Field>
      )}
      {role === "contractor" && (
        <>
          <Field label="Vak">
            <input name="trade" className={inputClass} placeholder="Schilder, meubelmaker…" />
          </Field>
          <Field label="Toegang tot">
            <input key={delivery} name="until" type="date" defaultValue={delivery ? addDays(delivery, 30) : ""} className={inputClass} />
          </Field>
        </>
      )}
      <label className="flex items-center gap-2 self-end text-sm">
        <input key={role} name="twoFactor" type="checkbox" defaultChecked={role === "contractor"} /> Tweestapsverificatie verplicht
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit">Uitnodiging versturen</Button>
        {sent && <span className="text-sm text-sage">Uitgenodigd: {sent}</span>}
      </div>
    </form>
  );
}
