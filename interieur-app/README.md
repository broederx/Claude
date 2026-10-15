# mim | interiors: klantportaal (prototype)

Klikbaar prototype van een klantportaal voor interieurarchitectuur: moodboard,
wensen, documenten, producten & budget, planning, berichten en
offertes & facturen. Zie [CONCEPT.md](CONCEPT.md) voor het concept en het
stappenplan.

## Starten

```bash
cd interieur-app
npm install
npm run dev
```

Open http://localhost:3000. Wissel rechtsboven tussen **Studio** en **Klant**
om beide kanten te zien. **Reset demo** zet de voorbeelddata terug.

## Online zetten

- **Echte versie met inloggen en database:** volg [ONLINE.md](ONLINE.md)
  (Supabase + Vercel). De database en de beveiligingsregels staan in
  `supabase/`.
- **Alleen de demo:** `npm run build:site` maakt `site/index.html`, de hele
  demo in één bestand die je op elke webhosting kunt zetten.

## Goed om te weten

- Zonder Supabase-instellingen is het een demo: alle data staat dan alleen in
  de browser (localStorage). Het voorbeeldproject voor de klant is *Villa
  Wassenaar*. Met de instellingen uit `.env.example` is het de echte app.
- Bedrijfsgegevens voor facturen staan in `src/lib/studio.ts`.
- Kleuren staan in `src/app/globals.css`, lettertypes in `src/app/layout.tsx`.
- Voorbeelddata staat in `src/lib/seed.ts`.
