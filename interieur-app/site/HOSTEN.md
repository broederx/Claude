# Het klantportaal online zetten

`index.html` in deze map is de hele app in één bestand: geen server, database
of installatie nodig. Je kunt het op elke gewone webhosting zetten.

## Snelste manier: Netlify Drop (gratis, 2 minuten)

1. Ga naar https://app.netlify.com/drop.
2. Sleep deze map (`site`) in het venster.
3. Je krijgt meteen een link, zoals `https://iets-willekeurigs.netlify.app`.
4. Maak een gratis account aan als je de link wilt bewaren of een eigen naam
   wilt geven, bijvoorbeeld `portaal.miminteriors.com`.

Een nieuwe versie zet je online door de map opnieuw te slepen, op de pagina
**Deploys** van je site.

## Andere opties

- **Eigen hosting** (bijvoorbeeld bij je websitepartij): upload `index.html` in
  een submap, bijvoorbeeld `miminteriors.com/portaal/`.
- **GitHub Pages**: deze map staat al in de repository. Zet Pages aan in de
  repository-instellingen en kies deze map als bron.

## Goed om te weten

- Het blijft een **prototype**. Wat iemand aanklikt, wordt alleen in diens
  eigen browser bewaard. Klanten zien dus elkaars wijzigingen niet, en jij ziet
  ze ook niet.
- Iedereen met de link kan het openen. Zoekmachines zijn gevraagd de pagina
  niet op te nemen (`noindex`), maar deel de link alleen met wie hem mag zien.
- Na het herladen van de pagina begin je weer op de startpagina.
- Een nieuwe versie maken: in de map `interieur-app` voer je `npm run build:site` uit.
