import { RandomNumberGenerator } from "jl-utlts";

/**
 * Colores de camiseta de una institución: un color principal (fondo) y uno
 * alternativo (texto/detalle), pensados para usarse juntos con buen contraste.
 */
export interface IKitColors {
  /** Color principal (hex, p. ej. fondo de una cabecera). */
  primary: string;
  /** Color alternativo (hex, p. ej. texto sobre el principal). */
  secondary: string;
}

/**
 * Hash determinístico de un string a un entero no negativo (variante djb2).
 * Sirve de semilla reproducible para el RNG a partir del id de la institución.
 */
function hashStringToSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0; // h * 33 + c (32-bit)
  }
  return Math.abs(h);
}

// ----------------------------------------------------------------------------
// Conversión HSL -> hex y contraste (WCAG) para generar colores legibles.
// ----------------------------------------------------------------------------

/** HSL (h:0-360, s:0-100, l:0-100) -> "#rrggbb". */
function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to255 = (v: number) => Math.round((v + m) * 255);
  const hex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${hex(to255(r))}${hex(to255(g))}${hex(to255(b))}`;
}

/** Luminancia relativa (WCAG) de un color HSL, aproximada vía su luminosidad. */
function relativeLuminanceOfL(l: number): number {
  // Para decidir claro/oscuro alcanza la luminosidad L del HSL (0-100).
  return l / 100;
}

/**
 * Genera un par de colores de camiseta de forma DETERMINÍSTICA a partir de un id.
 *
 * A diferencia de una paleta fija, los colores se GENERAN: se elige un matiz (hue) y
 * una saturación moderada-alta, y la luminosidad del principal es aleatoriamente CLARA
 * u OSCURA (no siempre oscura). El secundario se deriva con luminosidad OPUESTA (y baja
 * saturación) para garantizar contraste: a veces fondo oscuro + texto claro, a veces al
 * revés. El mismo id siempre produce el mismo par (RNG reproducible de jl-utlts).
 */
export function pickKitColors(id: string): IKitColors {
  const seed = hashStringToSeed(id);
  const rnd = RandomNumberGenerator.makeRandomInt(seed);

  const hue = rnd(360);                 // 0..359
  const sat = 55 + rnd(30);             // 55..84 (saturado pero no neón)
  const dark = rnd(2) === 0;            // el principal, ¿oscuro o claro?

  // Luminosidad del principal según sea oscuro o claro.
  const primaryL = dark ? 22 + rnd(16) : 72 + rnd(14); // oscuro 22..37 / claro 72..85
  const primary = hslToHex(hue, sat, primaryL);

  // Secundario: luminosidad OPUESTA y saturación baja (tono neutro del mismo matiz),
  // para asegurar legibilidad del texto sobre el fondo principal.
  const secondaryL = dark ? 88 + rnd(10) : 14 + rnd(12); // claro 88..97 / oscuro 14..25
  const secondarySat = 15 + rnd(20);                     // 15..34 (tono suave)
  let secondary = hslToHex(hue, secondarySat, secondaryL);

  // Garantía final de contraste: si la diferencia de luminosidad fuese insuficiente,
  // forzar el secundario a casi-blanco o casi-negro.
  if (Math.abs(relativeLuminanceOfL(primaryL) - relativeLuminanceOfL(secondaryL)) < 0.45) {
    secondary = dark ? "#f8fafc" : "#0f172a";
  }

  return { primary, secondary };
}

// ----------------------------------------------------------------------------
// Alternativa descartada: paleta fija de pares. Siempre daba principal OSCURO +
// secundario CLARO (sin variedad). Se deja comentada por si se quisiera volver a un
// catálogo curado en vez de generación algorítmica.
// ----------------------------------------------------------------------------
// const KIT_PALETTE: IKitColors[] = [
//   { primary: "#1e293b", secondary: "#e2e8f0" }, // slate oscuro / claro
//   { primary: "#4338ca", secondary: "#e0e7ff" }, // indigo / lavanda
//   { primary: "#047857", secondary: "#d1fae5" }, // emerald / menta
//   { primary: "#b45309", secondary: "#fef3c7" }, // amber oscuro / crema
//   { primary: "#9f1239", secondary: "#ffe4e6" }, // rose oscuro / rosa claro
//   { primary: "#0f766e", secondary: "#ccfbf1" }, // teal / aqua claro
//   { primary: "#6d28d9", secondary: "#ede9fe" }, // violet / lila claro
//   { primary: "#1d4ed8", secondary: "#dbeafe" }, // blue / celeste claro
//   { primary: "#be123c", secondary: "#fff1f2" }, // crimson / blanco rosado
//   { primary: "#166534", secondary: "#dcfce7" }, // green oscuro / verde claro
//   { primary: "#c2410c", secondary: "#ffedd5" }, // orange oscuro / durazno
//   { primary: "#334155", secondary: "#f8fafc" }, // gris azulado / casi blanco
// ];
//
// export function pickKitColors(id: string): IKitColors {
//   const seed = hashStringToSeed(id);
//   const randomInt = RandomNumberGenerator.makeRandomInt(seed);
//   const idx = randomInt(KIT_PALETTE.length);
//   return KIT_PALETTE[idx];
// }
