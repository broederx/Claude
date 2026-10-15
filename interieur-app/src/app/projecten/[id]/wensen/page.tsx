"use client";

import { useState } from "react";
import { setAppState, nowIso } from "@/lib/store";
import { longDate, time } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { Button, Card, PageHeader, inputClass } from "@/components/ui";

type Question =
  | { id: string; label: string; type: "multi"; options: string[] }
  | { id: string; label: string; type: "text"; placeholder?: string };

const sections: { title: string; questions: Question[] }[] = [
  {
    title: "Stijl & sfeer",
    questions: [
      {
        id: "styles",
        label: "Welke stijlen spreken je aan?",
        type: "multi",
        options: ["Warm minimalisme", "Japandi", "Klassiek modern", "Mid-century", "Industrieel", "Mediterraan", "Landelijk", "Art deco"],
      },
      {
        id: "materials",
        label: "Welke materialen wil je voelen in huis?",
        type: "multi",
        options: ["Hout", "Natuursteen", "Linnen", "Wol", "Messing/brons", "Keramiek", "Rotan", "Beton/microcement"],
      },
      { id: "colors", label: "Welke kleuren voelen voor jou als thuis?", type: "text", placeholder: "Bijv. zand, olijf, terracotta" },
      { id: "avoid", label: "Wat wil je absoluut niet?", type: "text" },
    ],
  },
  {
    title: "Wonen & gebruik",
    questions: [
      { id: "household", label: "Wie wonen er in huis? (ook huisdieren)", type: "text" },
      { id: "routine", label: "Hoe ziet een gewone dag of een fijn weekend eruit?", type: "text" },
      { id: "mustHaves", label: "Must-haves", type: "text", placeholder: "Bijv. grote eettafel, werkplek, veel opbergruimte" },
      { id: "keep", label: "Welke meubels of kunst wil je behouden?", type: "text" },
    ],
  },
  {
    title: "Prioriteiten",
    questions: [
      {
        id: "priorities",
        label: "Wat vind je het belangrijkst?",
        type: "multi",
        options: ["Duurzaamheid", "Onderhoudsgemak", "Akoestiek", "Daglicht", "Opbergruimte", "Uniek maatwerk", "Snel klaar"],
      },
      { id: "budgetComfort", label: "Hoe sta je tegenover het budget?", type: "text" },
    ],
  },
];

export default function WensenPage() {
  const { project, state, role } = useProject();
  const briefing = state.briefings.find((b) => b.projectId === project?.id);
  const [draft, setDraft] = useState<Record<string, string | string[]> | null>(null);
  const [saved, setSaved] = useState(false);
  if (!project) return null;

  const answers = draft ?? briefing?.answers ?? {};
  const editable = role === "client";

  function set(id: string, value: string | string[]) {
    setDraft({ ...answers, [id]: value });
    setSaved(false);
  }

  function save() {
    if (!project || !draft) return;
    const entry = { projectId: project.id, answers: draft, updatedAt: nowIso() };
    setAppState((s) => ({
      ...s,
      briefings: [...s.briefings.filter((b) => b.projectId !== project.id), entry],
    }));
    setDraft(null);
    setSaved(true);
  }

  return (
    <div>
      <PageHeader
        title="Woonwensen"
        intro={
          editable
            ? "Hoe beter we je kennen, hoe persoonlijker het ontwerp. Je kunt dit altijd aanvullen."
            : "Ingevuld door de klant. Dit vormt de basis voor het programma van eisen."
        }
        action={
          briefing?.updatedAt && (
            <p className="text-xs text-muted">
              Laatst bijgewerkt {longDate(briefing.updatedAt)} om {time(briefing.updatedAt)}
            </p>
          )
        }
      />

      {!editable && !briefing && (
        <Card className="mb-6 p-5 text-sm text-muted">De klant heeft de vragenlijst nog niet ingevuld.</Card>
      )}

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.title} className="p-6">
            <h3 className="mb-5 font-serif text-2xl">{section.title}</h3>
            <div className="space-y-6">
              {section.questions.map((q) => {
                const value = answers[q.id];
                return (
                  <div key={q.id}>
                    <p className="mb-2 text-sm text-muted">{q.label}</p>
                    {q.type === "multi" ? (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((option) => {
                          const list = Array.isArray(value) ? value : [];
                          const on = list.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={!editable}
                              aria-pressed={on}
                              onClick={() => set(q.id, on ? list.filter((v) => v !== option) : [...list, option])}
                              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                on ? "border-accent bg-accent text-white" : "border-border text-foreground/70"
                              } ${editable ? "hover:border-accent" : "cursor-default"}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    ) : editable ? (
                      <textarea
                        rows={2}
                        value={typeof value === "string" ? value : ""}
                        placeholder={q.placeholder}
                        onChange={(e) => set(q.id, e.target.value)}
                        className={inputClass}
                      />
                    ) : (
                      <p className="text-sm">{typeof value === "string" && value ? value : "—"}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {editable && (
        <div className="sticky bottom-4 mt-6 flex items-center justify-end gap-4">
          {saved && <span className="text-sm text-sage">Opgeslagen en gedeeld met de studio</span>}
          <Button onClick={save} disabled={!draft}>
            Opslaan
          </Button>
        </div>
      )}
    </div>
  );
}
