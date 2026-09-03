"use client";

import { useId, useState, type FormEvent } from "react";
import { waitlist } from "@/content/copy";

type Status = "idle" | "loading" | "success" | "error";

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

export default function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const emailId = useId();
  const statusId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!FORMSPREE_ENDPOINT) {
      setStatus("error");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (formData.get("_gotcha")) {
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (response.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p id={statusId} role="status" className="mt-8 text-lg text-sage">
        {waitlist.successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8" noValidate>
      <label htmlFor={emailId} className="sr-only">
        {waitlist.emailLabel}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={waitlist.placeholder}
          aria-describedby={status === "error" ? statusId : undefined}
          className="flex-1 rounded-full border border-border bg-white px-5 py-3.5 text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <input
          type="text"
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-accent px-8 py-3.5 text-base font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {status === "loading" ? waitlist.loadingLabel : waitlist.ctaLabel}
        </button>
      </div>
      <p id={statusId} role="alert" aria-live="polite" className="mt-3 min-h-5 text-sm text-accent">
        {status === "error" ? waitlist.errorMessage : ""}
      </p>
    </form>
  );
}
