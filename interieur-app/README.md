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

## Goed om te weten

- Alle data staat alleen in de browser (localStorage); er is nog geen
  database of inlog. Het voorbeeldproject voor de klant is *Villa Wassenaar*.
- Bedrijfsgegevens voor facturen staan in `src/lib/studio.ts`.
- Kleuren staan in `src/app/globals.css`, lettertypes in `src/app/layout.tsx`.
- Voorbeelddata staat in `src/lib/seed.ts`.
