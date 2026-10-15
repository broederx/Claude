# Het klantportaal online zetten

Zo zet je de echte versie van het klantportaal online, met inloggen en een
database. Reken op ongeveer een uur. Je hebt drie gratis accounts nodig:
**Supabase** (database en inloggen), **Vercel** (de website) en **Resend**
(het versturen van inlogmails).

Zolang stap 4 niet is gedaan, draait de app gewoon als demo met
voorbeelddata.

---

## Stap 1. Supabase: database aanmaken

1. Maak een account op https://supabase.com en klik op **New project**.
2. Geef het een naam, bijvoorbeeld `mim-portaal`.
3. Kies als regio **Europe (Frankfurt)** of een andere EU-regio. Dan blijven
   de gegevens van je klanten in de EU (AVG).
4. Bewaar het databasewachtwoord in je wachtwoordmanager. Je hebt het
   hierna niet nodig.

## Stap 2. Tabellen en beveiliging instellen

1. Open in Supabase links **SQL Editor** en kies **New query**.
2. Kopieer de hele inhoud van
   [`supabase/migrations/20261015000000_init.sql`](supabase/migrations/20261015000000_init.sql),
   plak die in de editor en klik op **Run**. Je moet "Success" zien.
3. Open een nieuwe query met de inhoud van [`supabase/studio.sql`](supabase/studio.sql).
   Vervang het e-mailadres door het adres waarmee jij wilt inloggen en klik
   op **Run**. Dit adres wordt beheerder (studio).

Een tweede beheerder voeg je later op dezelfde manier toe.

## Stap 3. Inlogmails instellen

Supabase verstuurt zelf maar heel weinig mails, en alleen naar leden van je
eigen Supabase-team. Om klanten en uitvoerders uit te nodigen, koppel je
daarom een maildienst.

1. Maak een account op https://resend.com en voeg je domein
   `miminteriors.com` toe. Resend toont een paar DNS-regels. Laat je
   websitebeheerder die toevoegen, of doe het zelf bij je domeinregistrar.
2. Maak in Resend een **API key** aan.
3. Ga in Supabase naar **Authentication → Emails → SMTP Settings**, zet
   **Enable custom SMTP** aan en vul in:
   - Sender email: `portaal@miminteriors.com`
   - Sender name: `mim | interiors`
   - Host: `smtp.resend.com`, poort `465`
   - Username: `resend`
   - Password: je Resend API key
4. Ga naar **Authentication → Emails → Templates → Magic Link**, en vervang
   onderwerp en tekst door een Nederlandse versie, bijvoorbeeld:

   Onderwerp: `Je inloglink voor het klantportaal van mim | interiors`

   ```html
   <h2>Welkom bij het klantportaal</h2>
   <p>Klik op de knop om in te loggen. De link werkt één keer en is één uur geldig.</p>
   <p><a href="{{ .ConfirmationURL }}">Inloggen bij mim | interiors</a></p>
   <p>Heb je dit niet aangevraagd? Dan kun je deze mail negeren.</p>
   ```

   Doe hetzelfde voor de template **Confirm signup**. Die krijgt iemand die
   voor het eerst inlogt.

## Stap 4. Vercel: de website

1. Maak een account op https://vercel.com, log in met GitHub en klik op
   **Add New → Project**.
2. Kies de repository **broederx/Claude**.
3. Zet **Root Directory** op `interieur-app`.
4. Open **Environment Variables** en voeg toe:
   - `NEXT_PUBLIC_SUPABASE_URL`: in Supabase onder
     **Project Settings → Data API → Project URL**.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: in Supabase onder
     **Project Settings → API Keys**, de **anon** (public) key.

   Gebruik **nooit** de `service_role`- of secret key: die mag niet in de
   website staan.
5. Klik op **Deploy**. Na een paar minuten krijg je een adres als
   `mim-portaal.vercel.app`.

Let op: het gratis Hobby-plan van Vercel is alleen voor niet-commercieel
gebruik. Voor gebruik met klanten heb je het Pro-plan nodig.

## Stap 5. Supabase het adres van de website vertellen

1. Ga in Supabase naar **Authentication → URL Configuration**.
2. Zet **Site URL** op het adres van stap 4, bijvoorbeeld
   `https://mim-portaal.vercel.app`.
3. Voeg hetzelfde adres toe bij **Redirect URLs**. Koppel je later een eigen
   domein, zoals `https://portaal.miminteriors.com`, voeg dat hier dan ook
   toe.

## Stap 6. Eerste keer inloggen

1. Open het adres van je website en vul het e-mailadres uit stap 2 in.
2. Klik op de link in de mail. Je komt in de studioweergave, nog zonder
   projecten.
3. Maak een project aan met de naam en het e-mailadres van de klant.
4. Klik in het projectoverzicht op **Uitnodiging sturen**. De klant krijgt
   een inloglink en ziet alleen dit project.
5. Uitvoerders voeg je toe onder **Uitvoerders**. Vink het project aan en
   klik op **Inloglink sturen**. Een uitvoerder ziet alleen de documenten
   die jij op **Definitief** zet.

## Een eigen adres (optioneel)

Voeg in Vercel onder **Settings → Domains** bijvoorbeeld
`portaal.miminteriors.com` toe en volg de DNS-instructies. Zet het nieuwe adres
daarna ook in Supabase (stap 5).

---

## Wat er nu wel en niet is

**Klaar:**
- Inloggen met een link per mail, zonder wachtwoord.
- Rechten die de database zelf afdwingt:
  - de studio ziet alles;
  - een klant ziet alleen het eigen project;
  - een uitvoerder ziet alleen de definitieve documenten van zijn
    projecten, zonder bedragen of klantgegevens.
- Echte bestanden: tekeningen en documenten staan in beveiligde opslag en
  openen via een tijdelijke link.
- Alle keuzes, akkoorden en berichten worden opgeslagen, en de anderen zien
  ze direct.

**Nog niet:**
- **Betalen via iDEAL.** De klant ziet nu je IBAN en markeert zelf niets als
  betaald; dat doe jij. Een koppeling met Mollie is de volgende stap.
- **Factuurnummers en boekhouding.** Factuurnummers worden in de app geteld.
  Voor je administratie blijft je boekhoudpakket leidend.
- **Afbeeldingen uploaden op het moodboard.** Dat kan nu alleen met een link.
- **Meldingen per mail** bij een nieuw bericht of een gevraagd akkoord.
- **Back-ups.** Supabase maakt op het gratis plan geen automatische back-ups
  die je zelf kunt terugzetten. Overweeg het Pro-plan zodra er echte
  klantgegevens in staan.

## Privacy (AVG)

- Kies een EU-regio (stap 1).
- Sluit de verwerkersovereenkomsten (DPA) af die Supabase, Vercel en Resend
  aanbieden.
- Vermeld in je privacyverklaring dat klantgegevens in het portaal worden
  opgeslagen.
