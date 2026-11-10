// Alle samlingstyper defineres her. For å legge til en ny type (f.eks. tegneserier
// eller klokker): legg til en ny nøkkel i TYPER. Resten av appen leser fra denne filen.

export type FeltType = 'tekst' | 'tall' | 'valg' | 'avkryss'

export interface FeltDef {
  nøkkel: string
  navn: string
  type: FeltType
  valg?: readonly string[]
  hint?: string
}

export interface TypeDef {
  navn: string
  flertall: string
  /** Ledetekst for tittelfeltet */
  tittelNavn: string
  /** Felt som settes sammen til undertittel i lister */
  undertittel: readonly string[]
  felt: readonly FeltDef[]
}

const TILSTAND = ['Ny', 'Meget god', 'God', 'Brukt', 'Slitt'] as const

export const TYPER = {
  bok: {
    navn: 'Bok',
    flertall: 'Bøker',
    tittelNavn: 'Tittel',
    undertittel: ['forfatter', 'år'],
    felt: [
      { nøkkel: 'forfatter', navn: 'Forfatter(e)', type: 'tekst' },
      { nøkkel: 'isbn', navn: 'ISBN', type: 'tekst' },
      { nøkkel: 'forlag', navn: 'Forlag', type: 'tekst' },
      { nøkkel: 'år', navn: 'År', type: 'tall' },
      { nøkkel: 'utgave', navn: 'Utgave', type: 'tekst' },
      { nøkkel: 'språk', navn: 'Språk', type: 'tekst' },
      {
        nøkkel: 'innbinding',
        navn: 'Innbinding',
        type: 'valg',
        valg: ['Innbundet', 'Heftet', 'Pocket', 'Skinn', 'Annet'],
      },
      { nøkkel: 'signert', navn: 'Signert', type: 'avkryss' },
      { nøkkel: 'nummerert', navn: 'Nummerert', type: 'tekst', hint: 'f.eks. 27/93' },
    ],
  },
  plate: {
    navn: 'Plate',
    flertall: 'Plater',
    tittelNavn: 'Tittel',
    undertittel: ['artist', 'format', 'år'],
    felt: [
      { nøkkel: 'artist', navn: 'Artist', type: 'tekst' },
      {
        nøkkel: 'format',
        navn: 'Format',
        type: 'valg',
        valg: ['LP', 'CD', 'Kassett', '7"', '10"', '12"', 'Boks', 'Annet'],
      },
      { nøkkel: 'plateselskap', navn: 'Plateselskap', type: 'tekst' },
      { nøkkel: 'katalognummer', navn: 'Katalognummer', type: 'tekst' },
      { nøkkel: 'år', navn: 'År', type: 'tall' },
      { nøkkel: 'pressing', navn: 'Pressing / land', type: 'tekst' },
      { nøkkel: 'tilstandPlate', navn: 'Tilstand plate', type: 'valg', valg: TILSTAND },
      { nøkkel: 'tilstandOmslag', navn: 'Tilstand omslag', type: 'valg', valg: TILSTAND },
    ],
  },
  film: {
    navn: 'Film',
    flertall: 'Filmer',
    tittelNavn: 'Tittel',
    undertittel: ['regissør', 'år', 'format'],
    felt: [
      { nøkkel: 'regissør', navn: 'Regissør', type: 'tekst' },
      { nøkkel: 'år', navn: 'År', type: 'tall' },
      {
        nøkkel: 'format',
        navn: 'Format',
        type: 'valg',
        valg: ['Blu-ray', '4K UHD', 'DVD', 'VHS', 'Annet'],
      },
      { nøkkel: 'utgave', navn: 'Utgave', type: 'tekst', hint: 'f.eks. Criterion, steelbook' },
      { nøkkel: 'region', navn: 'Region', type: 'tekst' },
    ],
  },
  instrument: {
    navn: 'Instrument',
    flertall: 'Instrumenter',
    tittelNavn: 'Navn',
    undertittel: ['produsent', 'modell', 'årgang'],
    felt: [
      { nøkkel: 'produsent', navn: 'Produsent', type: 'tekst' },
      { nøkkel: 'modell', navn: 'Modell', type: 'tekst' },
      { nøkkel: 'årgang', navn: 'Årgang', type: 'tall' },
      { nøkkel: 'serienummer', navn: 'Serienummer', type: 'tekst' },
      { nøkkel: 'finish', navn: 'Farge / finish', type: 'tekst' },
      { nøkkel: 'vekt', navn: 'Vekt (kg)', type: 'tall' },
      { nøkkel: 'tilstand', navn: 'Tilstand', type: 'valg', valg: TILSTAND },
    ],
  },
  annet: {
    navn: 'Annet',
    flertall: 'Annet',
    tittelNavn: 'Navn',
    undertittel: [],
    felt: [],
  },
} as const satisfies Record<string, TypeDef>

export type ItemType = keyof typeof TYPER

export const TYPE_IDER = Object.keys(TYPER) as ItemType[]

export function typeDef(type: ItemType): TypeDef {
  return TYPER[type]
}

export function erItemType(v: string | null | undefined): v is ItemType {
  return !!v && v in TYPER
}
