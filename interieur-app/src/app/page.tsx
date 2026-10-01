"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { addItem, openActions } from "@/lib/actions";
import { longDate, phaseIndex, phases, today } from "@/lib/format";
import { visibleProjects } from "@/lib/hooks";
import { newId, useAppState } from "@/lib/store";
import { studio } from "@/lib/studio";
import type { Project } from "@/lib/types";
import { Badge, Button, Card, Field, Swatches, inputClass } from "@/components/ui";
import ContractorDashboard from "@/components/ContractorDashboard";

export default function Dashboard() {
  const state = useAppState();
  const projects = visibleProjects(state);
  const actions = openActions(state, state.role).filter((a) => projects.some((p) => p.id === a.projectId));
  const isStudio = state.role === "architect";
  const [creating, setCreating] = useState(false);

  if (state.role === "contractor") return <ContractorDashboard />;

  return (
    <div className="space-y-12">
      <section>
        <p className="text-xs uppercase tracking-[0.25em] text-muted">
          {isStudio ? studio.tagline : "Welkom terug"}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">
          {isStudio ? `Goedendag, ${studio.architect.split(" ")[0]}` : "Jouw interieurproject"}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          {isStudio
            ? "Alle projecten, keuzes en facturen op één plek. Hieronder zie je wat er op jou wacht."
            : `Hier vind je alles van je project met ${studio.name}: het ontwerp, je keuzes, de planning en facturen.`}
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">Te doen</h2>
        {actions.length === 0 ? (
          <Card className="p-6 text-sm text-muted">Alles is bijgewerkt. Niets wacht op een reactie.</Card>
        ) : (
          <Card className="divide-y divide-border">
            {actions.map((action, i) => (
              <Link
                key={`${action.href}-${i}`}
                href={action.href}
                className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-background"
              >
                <span>{action.label}</span>
                <span className="shrink-0 text-xs text-muted">
                  {isStudio && state.projects.find((p) => p.id === action.projectId)?.name} →
                </span>
              </Link>
            ))}
          </Card>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted">
            {isStudio ? `Projecten (${projects.length})` : "Projecten"}
          </h2>
          {isStudio && !creating && (
            <Button variant="secondary" onClick={() => setCreating(true)}>
              + Nieuw project
            </Button>
          )}
        </div>
        {creating && <NewProjectForm onDone={() => setCreating(false)} />}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} showClient={isStudio} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ project, showClient }: { project: Project; showClient: boolean }) {
  const index = phaseIndex(project.phase);
  return (
    <Link href={`/projecten/${project.id}`} className="group">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-lg group-hover:shadow-foreground/5">
        <Swatches colors={project.coverColors} className="h-32" />
        <div className="space-y-3 p-5">
          <div>
            <h3 className="font-serif text-2xl">{project.name}</h3>
            <p className="text-sm text-muted">{showClient ? project.clientName : project.address}</p>
          </div>
          <div className="flex gap-1" aria-hidden>
            {phases.map((p, i) => (
              <span key={p.id} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <Badge tone="accent">{phases[index].label}</Badge>
            <span className="text-muted">Oplevering {longDate(project.deliveryDate)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function NewProjectForm({ onDone }: { onDone: () => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name"));
    const rooms = String(data.get("rooms"))
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    addItem("projects", {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${newId().slice(0, 4)}`,
      name,
      clientName: String(data.get("clientName")),
      clientEmail: String(data.get("clientEmail")),
      address: String(data.get("address")),
      phase: "kennismaking",
      budget: Number(data.get("budget")) || 0,
      startDate: today(),
      deliveryDate: String(data.get("deliveryDate")) || today(),
      coverColors: ["#e2d8c9", "#b5a38c", "#57534a"],
      rooms: rooms.length ? rooms : ["Woonkamer"],
    });
    onDone();
  }

  return (
    <Card className="mb-6 p-6">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Projectnaam">
          <input name="name" required className={inputClass} placeholder="Bijv. Herenhuis Utrecht" />
        </Field>
        <Field label="Adres">
          <input name="address" className={inputClass} />
        </Field>
        <Field label="Naam klant">
          <input name="clientName" required className={inputClass} />
        </Field>
        <Field label="E-mail klant (hiermee krijgt de klant toegang)">
          <input name="clientEmail" type="email" required className={inputClass} />
        </Field>
        <Field label="Budget inrichting (€)">
          <input name="budget" type="number" min="0" step="1000" className={inputClass} />
        </Field>
        <Field label="Gewenste oplevering">
          <input name="deliveryDate" type="date" className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Ruimtes (gescheiden door komma's)">
            <input name="rooms" className={inputClass} placeholder="Woonkamer, Keuken, Badkamer" />
          </Field>
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit">Project aanmaken</Button>
          <Button variant="ghost" onClick={onDone}>
            Annuleren
          </Button>
        </div>
        <p className="text-xs text-muted sm:col-span-2">
          In de echte app krijgt de klant nu een uitnodiging per e-mail.
        </p>
      </form>
    </Card>
  );
}
