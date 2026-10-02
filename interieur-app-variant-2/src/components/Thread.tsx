"use client";

import { useState, type FormEvent } from "react";
import { channelLabel, channelsFor, commentVisible, defaultChannel } from "@/lib/access";
import { postComment } from "@/lib/actions";
import { shortDate, time } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Channel, TargetType } from "@/lib/types";
import { Button, inputClass } from "@/components/ui";

const channelTone: Record<Channel, string> = {
  intern: "bg-warn/10 text-warn",
  klant: "bg-stone/50 text-foreground/80",
  uitvoerder: "bg-sage/15 text-sage",
  leverancier: "bg-accent/15 text-accent",
};

// Communicatie per onderwerp: berichten staan direct onder het product, de
// taak of de tekening waar ze over gaan.
export default function Thread({
  projectId,
  targetType,
  targetId,
  compact,
  contractorIds = [],
}: {
  projectId: string;
  targetType: TargetType;
  targetId: string;
  compact?: boolean;
  contractorIds?: string[];
}) {
  const { state, user } = useSession();
  const channels = channelsFor(user.role);
  const [channel, setChannel] = useState<Channel>(defaultChannel(user.role));
  const [to, setTo] = useState(contractorIds[0] ?? "");
  const [text, setText] = useState("");
  const [open, setOpen] = useState(!compact);

  const comments = state.comments.filter(
    (c) => c.targetType === targetType && c.targetId === targetId && commentVisible(state, user, c),
  );
  const contractors = state.users.filter((u) => u.role === "contractor" && u.projectIds.includes(projectId));
  const nameOf = (id?: string) => state.users.find((u) => u.id === id)?.name ?? "Onbekend";

  function send(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    let toUserId: string | undefined;
    if (channel === "uitvoerder") toUserId = user.role === "owner" ? to || undefined : undefined;
    postComment(user, projectId, targetType, targetId, channel, text.trim(), toUserId);
    setText("");
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
        {comments.length ? `${comments.length} bericht${comments.length > 1 ? "en" : ""}` : "Reageren"}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <ul className="space-y-2.5">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium">{c.authorId === user.id ? "Jij" : nameOf(c.authorId)}</span>
                <span className="text-xs text-muted">
                  {shortDate(c.at)} {time(c.at)}
                </span>
                {user.role === "owner" && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${channelTone[c.channel]}`}>
                    {channelLabel[c.channel]}
                    {c.toUserId && ` · ${nameOf(c.toUserId)}`}
                  </span>
                )}
              </div>
              <p className="text-foreground/85">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={send} className="space-y-2">
        {channels.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Kanaal">
            {channels
              .filter((c) => (c === "leverancier" ? targetType === "product" : true))
              .map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  aria-pressed={channel === c}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    channel === c ? "border-foreground bg-foreground text-background" : "border-border text-muted"
                  }`}
                >
                  {channelLabel[c]}
                </button>
              ))}
            {channel === "uitvoerder" && contractors.length > 0 && (
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="Aan uitvoerder"
                className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs"
              >
                <option value="">Kies uitvoerder</option>
                {contractors.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.company ?? u.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={channel === "intern" ? "Interne notitie, alleen voor de studio…" : "Schrijf een bericht…"}
            aria-label="Bericht"
            className={inputClass}
          />
          <Button type="submit" variant="secondary" disabled={!text.trim() || (channel === "uitvoerder" && user.role === "owner" && !to)}>
            Plaats
          </Button>
        </div>
      </form>
    </div>
  );
}
