import Link from "next/link";

export default function StudioOnly() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-serif text-3xl">Alleen voor de studio</h1>
      <p className="mt-2 text-muted">Dit onderdeel is niet zichtbaar voor klanten.</p>
      <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">
        Terug naar overzicht
      </Link>
    </div>
  );
}
