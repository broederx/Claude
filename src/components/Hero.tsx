import { hero } from "@/content/copy";

export default function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
      <p className="font-medium text-accent">{hero.kicker}</p>
      <h1
        id="hero-heading"
        className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl"
      >
        {hero.headline}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
        {hero.subheadline}
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-white/50 px-6 py-8 sm:px-10">
        <p className="font-serif text-xl text-foreground sm:text-2xl">{hero.dualMeaning.line1}</p>
        <p className="mt-1 font-serif text-xl text-foreground sm:text-2xl">{hero.dualMeaning.line2}</p>
        <p className="mt-4 text-sm text-muted">{hero.dualMeaning.note}</p>
      </div>

      <div className="mt-10">
        <a
          href="#wachtlijst"
          className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-base font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {hero.ctaLabel}
        </a>
      </div>
    </section>
  );
}
