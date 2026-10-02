"use client";

import { useState } from "react";
import { audit, briefing } from "@/lib/actions";
import { euro, nowIso } from "@/lib/format";
import { useProjectData } from "@/lib/session";
import { setAppState } from "@/lib/store";
import type { Intake } from "@/lib/types";
import { Button, Card, Field, PageHeader, SectionTitle, inputClass } from "@/components/ui";

const styleOptions = ["Warm minimalisme", "Japandi", "Klassiek modern", "Mid-century", "Industrieel", "Modern", "Mediterraan", "Landelijk"];

// Intake & klantprofiel. De klant vult in; de studio ziet direct een briefing.
export default function IntakeTab({ projectId }: { projectId: string }) {
  const { user, project } = useProjectData(projectId);
  const [draft, setDraft] = useState<Partial<Intake> | null>(null);
  const [saved, setSaved] = useState(false);
  const intake = draft ?? project.intake;
  const set = <K extends keyof Intake>(key: K, value: Intake[K]) => {
    setDraft({ ...intake, [key]: value });
    setSaved(false);
  };
  const summary = briefing({ ...project, intake });

  function save() {
    if (!draft) return;
    setAppState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, intake: { ...draft, updatedAt: nowIso() } } : p)),
    }));
    audit(user, "aangepast", "Intake", projectId);
    setDraft(null);
    setSaved(true);
  }

  const text = (key: keyof Intake, label: string, placeholder?: string) => (
    <Field label={label}>
      <textarea
        rows={2}
        value={(intake[key] as string) ?? ""}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value as never)}
        className={inputClass}
      />
    </Field>
  );

  return (
    <div>
      <PageHeader
        title="Intake & klantprofiel"
        intro={
          user.role === "client"
            ? "Vertel ons hoe je woont en wat je wilt. Hiervan maken we automatisch een projectbriefing."
            : "Wat de klant invult, wordt automatisch samengevat tot een projectbriefing."
        }
      />

      <Card className="mb-6 p-6">
        <SectionTitle>Automatische projectbriefing</SectionTitle>
        <p className="font-serif text-2xl leading-snug">{summary || "Nog te weinig ingevuld voor een briefing."}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-6">
          <SectionTitle>Woning</SectionTitle>
          <Field label="Woningtype">
            <input value={intake.woningtype ?? ""} onChange={(e) => set("woningtype", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Ruimtes (komma's ertussen)">
            <input
              value={(intake.ruimtes ?? []).join(", ")}
              onChange={(e) => set("ruimtes", e.target.value.split(",").map((r) => r.trim()).filter(Boolean))}
              className={inputClass}
            />
          </Field>
          <Field label="Focus op (komma's ertussen)">
            <input
              value={(intake.focus ?? []).join(", ")}
              onChange={(e) => set("focus", e.target.value.split(",").map((r) => r.trim()).filter(Boolean))}
              className={inputClass}
            />
          </Field>
          {text("praktisch", "Praktische eisen", "Bijv. vloerverwarming, draagmuren, lift")}
        </Card>

        <Card className="space-y-4 p-6">
          <SectionTitle>Budget en planning</SectionTitle>
          <Field label={`Budgetindicatie${intake.budgetIndicatie ? ` (${euro(intake.budgetIndicatie)})` : ""}`}>
            <input
              type="number"
              min="0"
              step="1000"
              value={intake.budgetIndicatie ?? ""}
              onChange={(e) => set("budgetIndicatie", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Oplevering gewenst vóór">
            <input type="date" value={intake.opleveringGewenst ?? ""} onChange={(e) => set("opleveringGewenst", e.target.value)} className={inputClass} />
          </Field>
        </Card>

        <Card className="space-y-4 p-6">
          <SectionTitle>Stijl</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((o) => {
              const on = (intake.stijl ?? []).includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("stijl", on ? (intake.stijl ?? []).filter((x) => x !== o) : [...(intake.stijl ?? []), o])}
                  className={`rounded-full border px-3 py-1 text-sm ${on ? "border-foreground bg-foreground text-background" : "border-border text-foreground/70"}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {text("mustHaves", "Must-haves")}
          {text("donts", "Don'ts")}
          <p className="text-xs text-muted">Inspiratiebeelden upload je in de echte app hier, of deel je als link in de berichten.</p>
        </Card>

        <Card className="space-y-4 p-6">
          <SectionTitle>Wonen</SectionTitle>
          {text("huishouden", "Gezins- en woonsituatie")}
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["kinderen", "Kinderen"],
                ["huisdieren", "Huisdieren"],
                ["thuiswerken", "Thuiswerken"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={!!intake[key]} onChange={(e) => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div className="sticky bottom-4 mt-6 flex items-center justify-end gap-4">
        {saved && <span className="text-sm text-sage">Opgeslagen</span>}
        <Button onClick={save} disabled={!draft}>
          Intake opslaan
        </Button>
      </div>
    </div>
  );
}
