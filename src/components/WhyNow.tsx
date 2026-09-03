import { whyNow } from "@/content/copy";

export default function WhyNow() {
  return (
    <section aria-labelledby="why-now-heading" className="border-t border-border px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="font-medium text-accent">{whyNow.kicker}</p>
        <h2 id="why-now-heading" className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">
          {whyNow.headline}
        </h2>

        <div className="mt-8 space-y-5">
          {whyNow.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </div>

        <p className="mt-8 rounded-2xl border border-border bg-white/50 px-6 py-5 font-serif text-xl text-foreground">
          {whyNow.reinforcement}
        </p>
      </div>
    </section>
  );
}
