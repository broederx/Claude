"use client";

import Link from "next/link";
import { useEffect } from "react";
import { roleLabel, tabsFor, type TabId } from "@/lib/access";
import { audit, noticesFor } from "@/lib/actions";
import { phaseIndex, phases } from "@/lib/labels";
import { useSession } from "@/lib/session";
import { Empty } from "@/components/ui";
import Overview from "./project/Overview";
import IntakeTab from "./project/IntakeTab";
import DesignTab from "./project/DesignTab";
import ProductsTab from "./project/ProductsTab";
import PlanningTab from "./project/PlanningTab";
import TasksTab from "./project/TasksTab";
import FilesTab from "./project/FilesTab";
import BudgetTab from "./project/BudgetTab";
import ChangeOrdersTab from "./project/ChangeOrdersTab";
import CommunicationTab from "./project/CommunicationTab";
import DecisionsTab from "./project/DecisionsTab";
import AccessTab from "./project/AccessTab";

const views: Record<TabId, (props: { projectId: string }) => React.ReactNode> = {
  overzicht: Overview,
  intake: IntakeTab,
  ontwerp: DesignTab,
  producten: ProductsTab,
  planning: PlanningTab,
  taken: TasksTab,
  bestanden: FilesTab,
  budget: BudgetTab,
  meerwerk: ChangeOrdersTab,
  communicatie: CommunicationTab,
  besluiten: DecisionsTab,
  toegang: AccessTab,
};

export default function ProjectView({ projectId, tab }: { projectId: string; tab?: string }) {
  const { state, user, projects } = useSession();
  const project = projects.find((p) => p.id === projectId);
  const tabs = project ? tabsFor(user, project) : [];
  const current = tabs.find((t) => t.id === (tab || "overzicht"));

  // Het openen van een project wordt gelogd, zodat de studio ziet wie keek.
  useEffect(() => {
    if (project && user.role !== "owner") audit(user, "bekeken", `Project ${project.name}`, project.id);
    // Alleen bij het openen van het project loggen, niet bij elke wijziging.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, user.id]);

  // Project-based access: wie geen toegang heeft, krijgt hetzelfde antwoord als
  // bij een project dat niet bestaat.
  if (!project) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-serif text-3xl">Project niet gevonden</h1>
        <p className="mt-2 text-muted">Dit project bestaat niet, of je hebt er (niet langer) toegang toe.</p>
        <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">
          Terug
        </Link>
      </div>
    );
  }

  const index = phaseIndex(project.phase);
  const base = `/projecten/${project.id}`;
  const notices = noticesFor(state, user).filter((n) => n.projectId === project.id);
  const View = current ? views[current.id] : null;
  const client = state.users.find((u) => u.id === project.clientId);

  return (
    <div>
      {user.role === "owner" && (
        <Link href="/projecten" className="text-sm text-muted hover:text-foreground">
          ← Alle projecten
        </Link>
      )}
      <header className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {phases[index].label} · {roleLabel[user.role].toLowerCase()}weergave
          </p>
          <h1 className="mt-1 font-serif text-4xl font-light sm:text-5xl">{project.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {user.role === "contractor" ? project.address : `${client?.company ?? client?.name} · ${project.address}`}
          </p>
        </div>
        <div className="flex h-9 w-36 overflow-hidden rounded-full">
          {project.coverColors.map((c) => (
            <span key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
      </header>

      <nav className="-mx-4 mt-6 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0" aria-label="Projectonderdelen">
        <ul className="flex gap-5 text-sm whitespace-nowrap">
          {tabs.map((t) => {
            const href = t.id === "overzicht" ? base : `${base}/${t.id}`;
            const count = notices.filter((n) => n.tab === t.id).length;
            const active = current?.id === t.id;
            return (
              <li key={t.id}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 py-3 ${
                    active ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-white">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pt-8">{View ? <View key={`${project.id}-${current!.id}`} projectId={project.id} /> : <Empty>Dit onderdeel is niet beschikbaar voor jouw rol.</Empty>}</div>
    </div>
  );
}
