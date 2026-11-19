import { HexColor, readableTextColor } from "./colorMath";

/**
 * Modelo de identidad cromática y equipaciones de una institución.
 *
 * Qué equipaciones existen y qué prendas tienen lo declara el deporte
 * (`ISportProfile.kitSpec`, de jl-sprt-core). Acá vive sólo la configuración de
 * cada prenda; el dibujo lo hace la app.
 */

export const SHIRT_PATTERNS = [
  'plain', 'vertical-stripes', 'horizontal-stripes', 'pinstripes',
  'halves', 'quarters', 'diagonal-sash', 'chevron',
  'horizontal-band', 'shoulder-panels',
] as const;
export type ShirtPattern = typeof SHIRT_PATTERNS[number];

export const COLLAR_TYPES = ['round', 'v-neck', 'polo'] as const;
export type CollarType = typeof COLLAR_TYPES[number];

export interface IShirtDesign {
  pattern: ShirtPattern;
  /** Color del cuerpo. */
  base: HexColor;
  /** Color del patrón (rayas, banda...). Obligatorio salvo en 'plain'. */
  detail?: HexColor;
  /** Color con el que se percibe la camiseta (choques, colores web). Por defecto: `base`. */
  dominant?: HexColor;
  sleeves: HexColor;
  cuffs: HexColor;
  collar: { type: CollarType; color: HexColor };
}

/** Pantalón: color y una franja lateral opcional. */
export interface IShortsDesign {
  base: HexColor;
  trim?: HexColor;
}

/** Medias: color y una banda superior opcional. */
export interface ISocksDesign {
  base: HexColor;
  band?: HexColor;
}

/**
 * Una equipación. `shorts` y `socks` están presentes si y sólo si el deporte los
 * declara en `kitSpec.garments`.
 */
export interface IKitDesign {
  shirt: IShirtDesign;
  shorts?: IShortsDesign;
  socks?: ISocksDesign;
}

/** Equipaciones de una institución, por id de equipación del deporte ('home', 'gk1'...). */
export type IKitSet = Record<string, IKitDesign>;

/** Colores institucionales (1 a 4). `colors[0]` es el principal. */
export interface IInstitutionIdentity {
  colors: HexColor[];
}

/** Identidad y equipaciones de una institución. */
export interface IInstitutionKits {
  identity: IInstitutionIdentity;
  kits: IKitSet;
}

/** Par de colores para la interfaz (fondo y texto legible). Derivado, nunca se guarda. */
export interface IWebColors {
  bg: HexColor;
  fg: HexColor;
}

/** Color dominante de la camiseta de una equipación. */
export function shirtDominant(kit: IKitDesign): HexColor {
  return kit.shirt.dominant ?? kit.shirt.base;
}

/** Colores web a partir de un color de fondo: el texto es blanco o negro según WCAG. */
export function webColorsOf(bg: HexColor): IWebColors {
  return { bg, fg: readableTextColor(bg) };
}
