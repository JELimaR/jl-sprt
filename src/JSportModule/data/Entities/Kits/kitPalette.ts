import { HexColor } from "./colorMath";
import { CollarType, ShirtPattern } from "./kitTypes";

/**
 * Paleta y parámetros del generador de equipaciones.
 *
 * Los pesos son relativos (no hace falta que sumen 100). Son valores iniciales para
 * ajustar mirando el visualizador de kits.
 */

export interface IPaletteColor {
  readonly id: string;
  readonly name: string;
  readonly hex: HexColor;
  readonly weight: number;
}

/** Colores de club, ponderados por lo frecuentes que son (como la paleta de myFPL). */
export const KIT_PALETTE: readonly IPaletteColor[] = Object.freeze([
  { id: 'white', name: 'Blanco', hex: '#ffffff', weight: 14 },
  { id: 'black', name: 'Negro', hex: '#111111', weight: 10 },
  { id: 'red', name: 'Rojo', hex: '#d21f2b', weight: 14 },
  { id: 'blue', name: 'Azul', hex: '#1f4fa8', weight: 13 },
  { id: 'navy', name: 'Azul marino', hex: '#14213d', weight: 8 },
  { id: 'sky', name: 'Celeste', hex: '#74b3e0', weight: 6 },
  { id: 'green', name: 'Verde', hex: '#1b8a3a', weight: 7 },
  { id: 'yellow', name: 'Amarillo', hex: '#f5c400', weight: 6 },
  { id: 'maroon', name: 'Granate', hex: '#7a1f2b', weight: 5 },
  { id: 'orange', name: 'Naranja', hex: '#f07c1d', weight: 4 },
  { id: 'purple', name: 'Violeta', hex: '#5b2a86', weight: 3 },
  { id: 'burgundy', name: 'Bordó oscuro', hex: '#4a0f1c', weight: 2 },
  { id: 'grey', name: 'Gris', hex: '#8a8d91', weight: 2 },
  { id: 'gold', name: 'Dorado', hex: '#c9a227', weight: 2 },
  { id: 'pink', name: 'Rosa', hex: '#e86aa6', weight: 1 },
  { id: 'teal', name: 'Verde agua', hex: '#1aa59a', weight: 1 },
]);

/** Colores de las equipaciones especiales (arquero, líbero). */
export const SPECIAL_KIT_PALETTE: readonly IPaletteColor[] = Object.freeze([
  { id: 'green', name: 'Verde', hex: '#1b8a3a', weight: 5 },
  { id: 'yellow', name: 'Amarillo', hex: '#f5c400', weight: 5 },
  { id: 'orange', name: 'Naranja', hex: '#f07c1d', weight: 4 },
  { id: 'black', name: 'Negro', hex: '#111111', weight: 4 },
  { id: 'grey', name: 'Gris', hex: '#8a8d91', weight: 3 },
  { id: 'pink', name: 'Rosa', hex: '#e86aa6', weight: 2 },
  { id: 'lime', name: 'Lima', hex: '#a8d81c', weight: 3 },
]);

export interface IKitParams {
  /** ΔE (CIE76) por debajo del cual dos camisetas chocan. */
  readonly clashDeltaE: number;
  /** Pesos de la cantidad de colores institucionales (1, 2 y 3). */
  readonly identityColorCountWeights: readonly [number, number, number];
  /** Probabilidad de tener una equipación de campo opcional (tercera). */
  readonly optionalFieldProbability: number;
  /** Probabilidad de tener una equipación especial opcional (arquero 2, líbero 2). */
  readonly optionalSpecialProbability: number;
  /** Probabilidad de que la alternativa use el segundo color institucional antes que blanco/negro. */
  readonly awayUsesSecondColorProbability: number;
  /** Probabilidad de que la alternativa (y siguientes) sean lisas. */
  readonly alternativePlainProbability: number;
  /** Probabilidad de que una especial sea lisa. */
  readonly specialPlainProbability: number;
  /** Patrones de camiseta de la titular. */
  readonly patternWeights: Readonly<Record<ShirtPattern, number>>;
  readonly collarWeights: Readonly<Record<CollarType, number>>;
  /** Probabilidad de mangas del color secundario del kit (si no, del cuerpo). */
  readonly contrastSleevesProbability: number;
  /** Probabilidad de pantalón del color secundario del kit (si no, del cuerpo). */
  readonly contrastShortsProbability: number;
  /** Probabilidad de franja lateral en el pantalón. */
  readonly shortsTrimProbability: number;
  /** Probabilidad de medias del color del pantalón (si no, del cuerpo de la camiseta). */
  readonly socksLikeShortsProbability: number;
  /** Probabilidad de banda superior en las medias. */
  readonly socksBandProbability: number;
}

export const KIT_PARAMS: IKitParams = Object.freeze({
  clashDeltaE: 25,
  identityColorCountWeights: [40, 45, 15] as const,
  optionalFieldProbability: 0.3,
  optionalSpecialProbability: 0.5,
  awayUsesSecondColorProbability: 0.3,
  alternativePlainProbability: 0.8,
  specialPlainProbability: 0.85,
  patternWeights: Object.freeze({
    'plain': 40,
    'vertical-stripes': 15,
    'horizontal-stripes': 8,
    'pinstripes': 5,
    'halves': 5,
    'quarters': 2,
    'diagonal-sash': 5,
    'chevron': 3,
    'horizontal-band': 6,
    'shoulder-panels': 8,
  }),
  collarWeights: Object.freeze({ 'round': 50, 'v-neck': 30, 'polo': 20 }),
  contrastSleevesProbability: 0.2,
  contrastShortsProbability: 0.6,
  shortsTrimProbability: 0.35,
  socksLikeShortsProbability: 0.5,
  socksBandProbability: 0.4,
});
