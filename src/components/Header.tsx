import { header, site } from "@/content/copy";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-serif text-2xl font-medium text-foreground">
          {site.name}
        </span>
        <a
          href="#wachtlijst"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {header.ctaLabel}
        </a>
      </div>
    </header>
  );
}
