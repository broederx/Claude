import { footer, site } from "@/content/copy";

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center text-sm text-muted">
        <span className="font-serif text-lg text-foreground">{site.name}</span>
        <p>{footer.line}</p>
        <p>{footer.copyright}</p>
      </div>
    </footer>
  );
}
