import { contentTypes } from "@/content/copy";

export default function ContentTypes() {
  return (
    <section
      aria-labelledby="content-types-heading"
      className="border-t border-border bg-white/40 px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-medium text-sage">{contentTypes.kicker}</p>
          <h2 id="content-types-heading" className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">
            {contentTypes.headline}
          </h2>
          <p className="mt-4 text-lg text-muted">{contentTypes.subheadline}</p>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contentTypes.items.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border bg-background p-6 text-left"
            >
              <span aria-hidden="true" className="text-3xl">
                {item.emoji}
              </span>
              <h3 className="mt-3 font-serif text-lg text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
