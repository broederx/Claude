import Link from "next/link";

export default function StudioOnly() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-serif text-3xl">Niet beschikbaar</h1>
      <p className="mt-2 text-muted">Dit onderdeel is er alleen voor de studio, of je hebt (nog) geen toegang tot een project.</p>
      <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">
        Naar het begin
      </Link>
    </div>
  );
}
