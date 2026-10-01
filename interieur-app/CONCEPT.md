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
| Uitvoerder (aannemer, schilder, elektricien…) | Alleen de definitieve documentatie van de projecten waar de studio toegang toe geeft. Geen klantgegevens, prijzen, orders, planning of berichten |

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

**Leveranciers (alleen studio).** Een apart onderdeel, volledig gescheiden
van de klantkant:

- Een overzicht van leveranciers met contactpersoon, dealernummer, korting,
  voorwaarden en interne notities.
- Per product legt de studio de leverancier en de inkoopprijs vast. De klant
  ziet alleen de verkoopprijs, nooit de leverancier, de inkoopprijs of de
  marge.
- Goedgekeurde producten bestel je per leverancier met een inkooporder. Er
  komt één order per project, zodat kosten en leveringen per project
  gescheiden blijven. Een order gaat van verstuurd via bevestigd naar
  geleverd, met een verwachte leverdatum en een afleveradres (project of
  studio).

Leveranciers hebben geen eigen inlog; orders lopen via de studio.

**Uitvoerders.** Aannemers, schilders, elektriciens en andere vakmensen loggen
zelf in en zien **alleen de definitieve documentatie** van de projecten die de
studio voor hen aanvinkt, met projectnaam en adres. Definitief betekent:
goedgekeurd door de klant, nooit contracten, concepten of documenten waarover
nog een wijziging loopt. De studio kan een definitief document per stuk
afschermen. Komt er een nieuwe versie ter goedkeuring, dan verdwijnt het
document bij de uitvoerder tot de klant opnieuw akkoord geeft.

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
| 4. Uitbreiding | Opleverdossier, push-notificaties, markeren op tekeningen | Volledige projectflow in de app |

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

## Afspraken

- Klanten worden aangesproken met **je**.

## Open vragen

- Officiële **huisstijl**: het logo is verwerkt en de kleuren zijn afgeleid van het logo-grijs; de exacte kleurcodes en lettertypes zijn nog een benadering.
- Bedrijfsgegevens voor facturen: adres, KvK, btw-nummer en IBAN.
- Welk boekhoudpakket gebruik je nu?
- Werken klanten vaak met twee personen (partners) die allebei toegang
  willen?
- In het prototype bestelt de studio in eigen naam en belast door. Moet de
  klant ook zelf rechtstreeks kunnen bestellen?
