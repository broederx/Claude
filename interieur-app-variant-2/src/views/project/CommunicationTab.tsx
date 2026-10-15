"use client";

import { useState } from "react";
import { channelLabel, channelsFor, commentVisible } from "@/lib/access";
import { shortDate, time } from "@/lib/format";
import { useProjectData } from "@/lib/session";
import type { AppState, Channel, Comment } from "@/lib/types";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import Thread from "@/components/Thread";

const typeLabel: Record<Comment["targetType"], string> = {
  project: "Algemeen",
  product: "Product",
  task: "Taak",
  file: "Tekening",
  choice: "Keuze",
  room: "Ruimte",
  budget: "Budget",
  changeOrder: "Meerwerk",
};

function subjectOf(state: AppState, c: Comment) {
  switch (c.targetType) {
    case "product":
      return state.products.find((p) => p.id === c.targetId)?.name;
    case "task":
      return state.tasks.find((t) => t.id === c.targetId)?.title;
    case "file":
      return state.files.find((f) => f.id === c.targetId)?.title;
    case "choice":
      return state.choices.find((x) => x.id === c.targetId)?.question;
    case "changeOrder":
      return state.changeOrders.find((x) => x.id === c.targetId)?.title;
    case "room":
      return c.targetId;
    case "budget":
      return "Budget";
    default:
      return "Algemeen";
  }
}

// Geen grote chat, maar communicatie per onderwerp.
export default function CommunicationTab({ projectId }: { projectId: string }) {
  const { state, user, scoped } = useProjectData(projectId);
  const [channel, setChannel] = useState<Channel | "alle">("alle");
  const [open, setOpen] = useState<string | null>(null);
  const visible = scoped(state.comments).filter((c) => commentVisible(state, user, c) && (channel === "alle" || c.channel === channel));

  const threads = new Map<string, Comment[]>();
  for (const c of visible) {
    const key = `${c.targetType}:${c.targetId}`;
    threads.set(key, [...(threads.get(key) ?? []), c]);
  }
  const sorted = [...threads.entries()].sort((a, b) => b[1].at(-1)!.at.localeCompare(a[1].at(-1)!.at));
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name.split(" ")[0] ?? "";
  const contractorIds = state.users.filter((u) => u.role === "contractor" && u.projectIds.includes(projectId)).map((u) => u.id);

  return (
    <div>
      <PageHeader
        title={user.role === "contractor" ? "Vragen" : "Communicatie"}
        intro="Berichten staan bij het onderwerp waar ze over gaan: een product, taak, tekening, ruimte of budgetregel. Zo hoef je nooit te zoeken waar iets besproken is."
      />
      {user.role === "owner" && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(["alle", ...channelsFor(user.role)] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              aria-pressed={channel === c}
              className={`rounded-full border px-3 py-1 text-sm ${channel === c ? "border-foreground bg-foreground text-background" : "border-border text-muted"}`}
            >
              {c === "alle" ? "Alle kanalen" : channelLabel[c]}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {sorted.length === 0 && <p className="text-sm text-muted">Nog geen berichten.</p>}
          {sorted.map(([key, comments]) => {
            const last = comments.at(-1)!;
            const [type, id] = key.split(":");
            return (
              <Card key={key} className="p-4">
                <button type="button" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key} className="w-full text-left">
                  <p className="text-xs text-muted">
                    {typeLabel[last.targetType]} · {comments.length} bericht{comments.length > 1 ? "en" : ""} · {shortDate(last.at)} {time(last.at)}
                  </p>
                  <p className="font-medium">{subjectOf(state, last)}</p>
                  {open !== key && (
                    <p className="line-clamp-1 text-sm text-foreground/75">
                      {nameOf(last.authorId)}: {last.text}
                    </p>
                  )}
                </button>
                {open === key && (
                  <div className="mt-3 border-t border-border pt-3">
                    <Thread projectId={projectId} targetType={type as Comment["targetType"]} targetId={id} contractorIds={contractorIds} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        <Card className="h-fit p-4">
          <SectionTitle>{user.role === "contractor" ? "Algemene vraag aan de studio" : "Algemeen bericht"}</SectionTitle>
          <Thread projectId={projectId} targetType="project" targetId={projectId} contractorIds={contractorIds} />
        </Card>
      </div>
    </div>
  );
}
