import { waitlist } from "@/content/copy";
import WaitlistForm from "@/components/WaitlistForm";

export default function Waitlist() {
  return (
    <section
      id="wachtlijst"
      aria-labelledby="waitlist-heading"
      className="border-t border-border bg-white/40 px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-medium text-accent">{waitlist.kicker}</p>
        <h2 id="waitlist-heading" className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">
          {waitlist.headline}
        </h2>
        <p className="mt-4 text-lg text-muted">{waitlist.subheadline}</p>

        <WaitlistForm />
      </div>
    </section>
  );
}
