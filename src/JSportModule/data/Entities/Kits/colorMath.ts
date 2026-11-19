/**
 * Cálculos de color para las equipaciones.
 *
 * - Legibilidad: luminancia relativa y contraste de WCAG 2.x (sobre sRGB lineal).
 * - Choques: distancia perceptual ΔE en CIELAB (CIE76, iluminante D65). Un ΔE menor
 *   a ~25 se considera "camisetas que se confunden" (umbral en KIT_PARAMS).
 */

/** Color en formato "#rrggbb". */
export type HexColor = string;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const KIT_WHITE: HexColor = '#ffffff';
export const KIT_BLACK: HexColor = '#15161a';

export function isHexColor(value: unknown): value is HexColor {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

/** "#RRGGBB" -> [r, g, b] en 0..255. Lanza si no es un hex válido. */
export function hexToRgb(hex: HexColor): [number, number, number] {
  if (!isHexColor(hex)) throw new Error(`invalid hex color '${hex}'`);
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Canal sRGB (0..255) a valor lineal (0..1). */
function linearChannel(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Luminancia relativa WCAG (0 = negro, 1 = blanco). */
export function relativeLuminance(hex: HexColor): number {
  const [r, g, b] = hexToRgb(hex).map(linearChannel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre dos colores (1..21). */
export function contrastRatio(a: HexColor, b: HexColor): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Blanco o negro: el que más contraste tenga sobre `bg`. */
export function readableTextColor(bg: HexColor): HexColor {
  return contrastRatio(bg, KIT_WHITE) >= contrastRatio(bg, KIT_BLACK) ? KIT_WHITE : KIT_BLACK;
}

/** sRGB -> CIELAB (D65). */
export function hexToLab(hex: HexColor): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(linearChannel);
  // sRGB lineal -> XYZ (D65), normalizado por el blanco de referencia.
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / 1.0;
  const z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Distancia perceptual ΔE (CIE76) entre dos colores. 0 = iguales. */
export function deltaE(a: HexColor, b: HexColor): number {
  const [l1, a1, b1] = hexToLab(a);
  const [l2, a2, b2] = hexToLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Menor ΔE de `color` contra una lista (Infinity si la lista está vacía). */
export function minDeltaE(color: HexColor, others: readonly HexColor[]): number {
  let min = Infinity;
  for (const o of others) min = Math.min(min, deltaE(color, o));
  return min;
}
