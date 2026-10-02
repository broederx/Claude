# mim | interiors: studioportaal (variant 2)

Klikbaar prototype van het klant- en uitvoeringsportaal voor zelfstandige
interieurarchitecten: "Eén waarheid voor klant, studio en uitvoerder, met
precies de juiste toegang per rol." Dezelfde huisstijl als `../interieur-app`,
maar een andere opzet, gebouwd rond rollen en rechten.

## Starten

```bash
cd interieur-app-variant-2
npm install
npm run dev            # Next.js op http://localhost:3000
npm run build:preview  # één los HTML-bestand in preview/dist/
```

Kies linksonder bij **Demo: ingelogd als** wie je bent: de studio (Janine),
een klant, een uitvoerder of een leverancier. Alles wat je doet, staat alleen
in je eigen browser; **Reset demo** zet de voorbeelddata terug.

## Wat erin zit (MVP versie 1)

- **Dashboard per project**: status, planning, openstaande keuzes,
  budgetstatus, lopende acties, laatste berichten, risico's en blokkades,
  documenten die akkoord nodig hebben.
- **Rollen en rechten** (`src/lib/access.ts`, het enige bestand dat over
  rechten beslist):
  - project-based access, met een einddatum voor uitvoerders
  - rechten per veld voor producten (verkoop, inkoop, marge, leverancier,
    interne notitie)
  - rechten per bestand (klant, uitvoerder, specifieke personen, downloaden,
    watermerk)
  - kanalen per rol voor berichten
- **Intake** met automatische projectbriefing.
- **Moodboard en keuzes**: per ruimte, altijd "kies A, B of C vóór [datum]".
- **Producten**: met zichtbaarheid per veld en per rol.
- **Budget in drie lagen**: intern, klant en uitvoerder.
- **Planning en taken**: één planning met drie weergaven, taken met
  afhankelijkheden, afvinken, foto's en problemen melden.
- **Bestanden met versiebeheer**: uitvoerders zien alleen de laatste
  goedgekeurde versie.
- **Workflows**:
  - Ontwerp goedkeuren: na akkoord ligt de versie vast en krijgen uitvoerders
    automatisch toegang.
  - Meerwerk: de uitvoerder meldt, de studio beoordeelt, de klant beslist,
    waarna het budget wordt aangepast.
- **Communicatie per onderwerp**, met interne notities.
- **Besluitlogboek** en **auditlog**.
- **Meldingen per rol**, en een overzicht van **rollen en rechten**.

## Nog niet in dit prototype

- Inloggen en tweestapsverificatie, echte opslag van bestanden, e-mail- en
  pushmeldingen.
- Spraakmemo's en watermerken op de bestanden zelf.
- Facturatie, AI-functies, templates en CRM.

Volgens het voorgestelde MVP horen die bij latere versies.
