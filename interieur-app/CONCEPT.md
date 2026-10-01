# mim | interiors: klantportaal

Eén plek waar studio en klant samenwerken aan een interieurproject: van
eerste moodboard tot laatste factuur. Weg met losse mails, WhatsApp-foto's,
PDF's in bijlagen en Excel-lijstjes.

## Waarom

- **Rust voor de klant.** Een high-end klant wil zien waar het project staat,
  wat er van hem of haar verwacht wordt en wat het kost, zonder te hoeven
  zoeken.
- **Vastgelegde keuzes.** Elke goedkeuring (tekening, product, offerte) staat
  met datum in het systeem. Dat voorkomt discussie achteraf.
- **Minder administratie.** Facturen, bestellingen en planning op dezelfde
  plek als het ontwerp.
- **Professionele uitstraling.** Een eigen portaal in de huisstijl past bij
  het high-end segment.

## Rollen

| Rol | Kan |
| --- | --- |
| Studio (Janine, later medewerkers) | Projecten aanmaken, alles delen, fase bijwerken, facturen maken |
| Klant (soms twee personen) | Eigen project(en) zien, reageren, goedkeuren, wensen invullen, betalen |
| Later: aannemer/leverancier | Alleen planning en relevante tekeningen per project |

## Onderdelen (in het prototype)

1. **Overzicht.** De zes projectfases (kennismaking → wensen → schetsontwerp
   → definitief ontwerp → uitvoering → oplevering), "wacht op jouw reactie",
   budget, eerstvolgende afspraken en honorarium.
2. **Moodboard.** Kleuren, materialen en inspiratie per ruimte. De klant
   reageert met *mooi / twijfel / niet voor mij* en commentaar, en kan zelf
   inspiratie toevoegen (bijv. een Pinterest-link).
3. **Wensen.** Een vragenlijst (stijl, materialen, kleuren, huishouden,
   must-haves, prioriteiten). Dit vormt het programma van eisen.
4. **Documenten.** Tekeningen, 3D-impressies, contracten en adviezen met
   versiebeheer. De klant keurt goed of vraagt een wijziging; de studio deelt
   een nieuwe versie.
5. **Producten & budget.** De inkooplijst per ruimte met leverancier, prijs en
   levertijd. Status: voorstel → goedgekeurd → besteld → geleverd. Budget,
   goedgekeurd, in voorstel en nog beschikbaar staan altijd bovenaan.
6. **Planning.** Afspraken, mijlpalen en leveringen op een tijdlijn.
7. **Berichten.** Een chat per project, met ongelezen-tellers.
8. **Offertes & facturen.** Offertes accepteren, facturen met btw-berekening,
   doorlopende nummering, betalen met iDEAL (gesimuleerd), opslaan als PDF.

Alles wat op een reactie wacht, verschijnt automatisch als "Te doen" op het
dashboard en als teller op het tabblad.

## Ideeën voor later

- **Ruimtes & maten.** Per ruimte de maatvoering, foto's van de bestaande
  situatie en plattegronden.
- **Markeren op tekeningen.** De klant zet een pin op een tekening of render
  met een opmerking.
- **Stalenkaart.** Fysieke stalen die de klant mee naar huis krijgt, met de
  codes en leveranciers erbij.
- **Meerwerk.** Wijzigingen tijdens de uitvoering als aparte offerte die de
  klant digitaal accepteert.
- **Uren registreren** per project en fase, automatisch naar een factuur.
- **Opleverdossier.** Na afloop één PDF met alle producten,
  onderhoudsadviezen, garanties en leveranciers. Een mooi afscheidscadeau.
- **Partners.** Aannemer, schilder en leveranciers met een beperkte
  weergave.
- **Notificaties** per e-mail en push (app op het beginscherm, PWA).
- **Digitaal ondertekenen** van de overeenkomst van opdracht.
- **Portfolio-koppeling.** Na oplevering, met toestemming, het project als
  case op miminteriors.com.
- **AI-hulp.** Een samenvatting van de wensenlijst als programma van eisen,
  of een moodboard-voorstel op basis van de wensen.

## Stappenplan

| Fase | Inhoud | Doel |
| --- | --- | --- |
| 1. Prototype *(nu)* | Klikbaar, met voorbeelddata in de browser | Vorm en functies toetsen, laten zien aan een paar vaste klanten |
| 2. MVP | Inloggen, echte opslag, uploads, berichten, documenten, moodboard, wensen | Eerste echte project erin draaien |
| 3. Financieel | Offertes en facturen, iDEAL via Mollie, koppeling met de boekhouding | Facturen niet meer dubbel maken |
| 4. Uitbreiding | Partners, opleverdossier, push-notificaties, markeren op tekeningen | Volledige projectflow in de app |

## Techniek (advies voor fase 2)

- **App:** Next.js (zoals het prototype), te installeren als app op telefoon
  en tablet (PWA). Een aparte iOS/Android-app is pas later nodig.
- **Inloggen:** de klant krijgt een link per e-mail (magic link), geen
  wachtwoord nodig. De studio logt in met e-mail en tweestapsverificatie.
- **Database & bestanden:** Supabase (Postgres + opslag in de EU), met
  rechten per project zodat een klant alleen het eigen project ziet.
- **Betalen:** Mollie (iDEAL, creditcard, betaallink in de factuurmail).
- **Boekhouding:** koppeling met Moneybird, e-Boekhouden of Exact, zodat
  facturen en betalingen automatisch doorkomen. Factuurnummering en
  btw-regels volgen de boekhouding.
- **E-mail:** Resend of Postmark voor uitnodigingen en meldingen.
- **Privacy (AVG):** data in de EU, verwerkersovereenkomsten, bewaartermijn
  van 7 jaar voor facturen, en een klant die zijn of haar gegevens kan
  opvragen.

## Open vragen

- Spreken we klanten aan met **je of u**? Het prototype gebruikt *je*.
- Officiële **huisstijl**: logo, kleuren en lettertypes (nu een benadering).
- Bedrijfsgegevens voor facturen: adres, KvK, btw-nummer en IBAN.
- Welk boekhoudpakket gebruik je nu?
- Werken klanten vaak met twee personen (partners) die allebei toegang
  willen?
- Wil je producten in je eigen naam bestellen en doorbelasten (marge
  zichtbaar voor de studio, niet voor de klant), of bestelt de klant zelf?
