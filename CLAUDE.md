# Samling

Personlig app som holder oversikt over samlingene mine: bøker, plater, filmer, gitarer og andre instrumenter, og ellers alt mulig annet. Appen brukes bare av meg, og hele grensesnittet er på norsk (bokmål).

## Status

- [x] **Fase 1** – datamodell, lagring, legge inn/redigere/slette manuelt, liste og detaljside
- [ ] **Fase 2** – bilder og kamera, rutenettvisning, forside med oppsummering, backup/gjenoppretting
- [ ] **Fase 3** – strekkodeskanning og API-oppslag
- [ ] **Fase 4** – import fra LibraryThing/CSV, forsikringsrapport og vedlikeholdslogg
- [ ] **Fase 5** – PWA-pakking (manifest, service worker, ikoner)

Bygg i faser, og stopp etter hver fase så jeg kan teste.

## Kommandoer

- `npm run dev` – utviklingsserver
- `npm run build` – typesjekk + produksjonsbygg (skal alltid gå grønt før commit)
- Push til `main` ruller ut til GitHub Pages via `.github/workflows/deploy.yml`

## Teknisk ramme

- React + Vite + TypeScript + Tailwind v4. Ingen tunge UI-biblioteker.
- Mobil først, men skal utnytte plassen på PC (tabellvisning, sidepanel).
- Alle data lagres lokalt i IndexedDB via Dexie (`src/db/db.ts`). Ingen server, ingen innlogging.
- Appen hostes statisk på GitHub Pages. Koden er offentlig, dataene er det ikke.
- API-nøkler (Discogs, TMDb, Google Books) legges inn under Innstillinger og lagres lokalt. De skal ALDRI ligge i koden eller i repoet.
- `HashRouter` og `base: './'` – nødvendig for GitHub Pages.
- Norske navn i kode (felt, komponenter, funksjoner), også med æøå.

## Datamodell

Typer i `src/model/types.ts`. Alle objekter har felles felt: id, type, tittel, status, plassering, kjøpsdato, kjøpspris, verdi, tagger, notater, bilder, opprettet/endret.

Status: `eid | ønsket | utlånt (til hvem, når) | solgt`.

Samlingstypene og feltene deres defineres i **ett** konfigurasjonsobjekt, `TYPER` i `src/model/typeConfig.ts`. Nye typer legges til der – ikke hardkod typer andre steder.

- Bok: forfatter(e), ISBN, forlag, år, utgave, språk, innbinding, signert, nummerert (f.eks. "27/93")
- Plate: artist, format, plateselskap, katalognummer, år, pressing/land, tilstand plate/omslag
- Film: regissør, år, format, utgave, region
- Instrument: produsent, modell, årgang, serienummer, farge/finish, vekt, tilstand + vedlikeholdslogg (dato, hva, hvem, kostnad)
- Annet: fritt, med egne nøkkel/verdi-felt (egne felt finnes på alle typer)

Bilder ligger i egen tabell (`bilder`), komprimert til ~1600px JPEG som blob. Endringer i tabeller/indekser krever ny `db.version(n)`.

## Gjenstår (fra opprinnelig spesifikasjon)

### Registrering (fase 3)
- Skann strekkode med kameraet (@zxing/browser e.l.), og mulighet for å skrive inn strekkoden manuelt.
- Bøker: Open Library først, så Google Books som reserve. Plater: Discogs på strekkode. Filmer: søk på tittel mot TMDb.
- Vis forslaget i skjemaet så det kan rettes før lagring. Hent coverbilde automatisk.
- Advarsel om mulige duplikater (samme ISBN, strekkode eller tittel).
- Ta bilde med kameraet direkte fra skjemaet (fase 2).

### Visning (fase 2)
- Forside med antall og total estimert verdi per type, og siste objekter.
- Rutenett med cover eller kompakt tabell. Filter på tagg og plassering.
- Detaljside med bildegalleri og historikk.

### Import/eksport (fase 2 og 4)
- Full backup til én JSON-fil (bilder base64) og gjenoppretting.
- CSV-eksport per type.
- Import fra LibraryThing (CSV/TSV) og generell CSV med kolonnekobling.
- Forsikringsrapport: PDF/utskriftsvennlig side med bilde, beskrivelse, serienummer og verdi, filtrert på utvalg.

## Design

Rolig og lekkert, mørkt og lyst tema (fargene er CSS-variabler i `src/index.css`). Coverbildene skal få plass. Store trykkflater på mobil (minst 44px), 16px skrift i inndatafelt.
