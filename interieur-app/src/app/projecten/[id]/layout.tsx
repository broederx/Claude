"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openActions } from "@/lib/actions";
import { phaseIndex, phases } from "@/lib/format";
import { useProject } from "@/lib/hooks";
import { Swatches } from "@/components/ui";

const tabs = [
  { slug: "", label: "Overzicht" },
  { slug: "moodboard", label: "Moodboard" },
  { slug: "wensen", label: "Wensen" },
  { slug: "documenten", label: "Documenten" },
  { slug: "producten", label: "Producten & budget" },
  { slug: "planning", label: "Planning" },
  { slug: "berichten", label: "Berichten" },
  { slug: "financien", label: "Offertes & facturen" },
];

export default function ProjectLayout({ children }: LayoutProps<"/projecten/[id]">) {
  const { project, state, role } = useProject();
  const pathname = usePathname();

  if (!project) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-serif text-3xl">Project niet gevonden</h1>
        <p className="mt-2 text-muted">Dit project bestaat niet of je hebt er geen toegang toe.</p>
        <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  const base = `/projecten/${project.id}`;
  const pending = openActions(state, role, project.id);
  const index = phaseIndex(project.phase);

  return (
    <div>
      <div className="print:hidden">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Alle projecten
        </Link>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {phases[index].label} · fase {index + 1} van {phases.length}
            </p>
            <h1 className="mt-1 font-serif text-4xl font-light sm:text-5xl">{project.name}</h1>
            <p className="mt-1 text-muted">
              {project.clientName} · {project.address}
            </p>
          </div>
          <Swatches colors={project.coverColors} className="h-10 w-40 rounded-full" />
        </div>

        <nav className="-mx-4 mt-8 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0" aria-label="Projectonderdelen">
          <ul className="flex gap-6 text-sm whitespace-nowrap">
            {tabs.map((tab) => {
              const href = tab.slug ? `${base}/${tab.slug}` : base;
              const active = tab.slug ? pathname.startsWith(href) : pathname === base;
              const count = pending.filter((a) => (tab.slug ? a.href.startsWith(href) : false)).length;
              return (
                <li key={tab.slug}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative -mb-px flex items-center gap-1.5 border-b-2 py-3 transition-colors ${
                      active ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    {tab.label}
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
      </div>

      <div className="pt-10 print:pt-0">{children}</div>
    </div>
  );
}
