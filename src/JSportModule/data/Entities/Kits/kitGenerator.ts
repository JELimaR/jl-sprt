import { RandomNumberGenerator } from "jl-utlts";
import { IKitSpec, KitGarment, assertKitSpec, fieldKitSlots } from "jl-sprt-core";
import { KIT_BLACK, HexColor, KIT_WHITE, deltaE, minDeltaE } from "./colorMath";
import { IPaletteColor, KIT_PALETTE, KIT_PARAMS, SPECIAL_KIT_PALETTE } from "./kitPalette";
import { CollarType, IInstitutionIdentity, IInstitutionKits, IKitDesign, IKitSet, ShirtPattern, shirtDominant } from "./kitTypes";
import { assertIdentity, assertKitSet } from "./kitValidation";

/**
 * Generación determinística de identidad y equipaciones.
 *
 * Semilla: hash del id de la institución, con una sub-semilla por equipación
 * (`<id>|<slotId>`), así agregar o quitar una equipación opcional no cambia la
 * secuencia aleatoria de las demás. El mismo id produce siempre lo mismo.
 */

type Rnd = () => number;

/** Hash djb2 de un string a entero no negativo. */
function hashSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rngFor(id: string, salt: string): Rnd {
  return RandomNumberGenerator.makeRandomFloat(hashSeed(`${id}|${salt}`));
}

function weightedPick<T>(entries: readonly (readonly [T, number])[], rnd: Rnd): T {
  const total = entries.reduce((acc, [, w]) => acc + w, 0);
  let r = rnd() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r < 0) return value;
  }
  return entries[entries.length - 1][0];
}

function pickPattern(rnd: Rnd): ShirtPattern {
  return weightedPick(Object.entries(KIT_PARAMS.patternWeights) as [ShirtPattern, number][], rnd);
}

function pickCollar(rnd: Rnd): CollarType {
  return weightedPick(Object.entries(KIT_PARAMS.collarWeights) as [CollarType, number][], rnd);
}

/**
 * Un color de la paleta que no choque con ninguno de `avoid` (ponderado por peso).
 * Si todos chocan, el más lejano.
 */
function pickFarColor(palette: readonly IPaletteColor[], avoid: readonly HexColor[], rnd: Rnd): HexColor {
  const threshold = KIT_PARAMS.clashDeltaE;
  const candidates = palette.filter((c) => minDeltaE(c.hex, avoid) >= threshold);
  if (candidates.length > 0) return weightedPick(candidates.map((c) => [c.hex, c.weight] as const), rnd);
  let best = palette[0].hex;
  let bestDist = -1;
  for (const c of palette) {
    const d = minDeltaE(c.hex, avoid);
    if (d > bestDist) { best = c.hex; bestDist = d; }
  }
  return best;
}

/** Blanco o negro: el más lejano a `base`. */
function contrastingNeutral(base: HexColor): HexColor {
  return deltaE(base, KIT_WHITE) >= deltaE(base, KIT_BLACK) ? KIT_WHITE : KIT_BLACK;
}

/** El primer candidato que se distinga de `base`; si ninguno, blanco o negro. */
function accentFor(base: HexColor, candidates: readonly HexColor[]): HexColor {
  return candidates.find((c) => deltaE(c, base) >= KIT_PARAMS.clashDeltaE) ?? contrastingNeutral(base);
}

/** Arma una equipación a partir de su color de cuerpo, su color secundario y el patrón. */
function buildKit(rnd: Rnd, base: HexColor, accent: HexColor, pattern: ShirtPattern, garments: readonly KitGarment[]): IKitDesign {
  const p = KIT_PARAMS;
  const kit: IKitDesign = {
    shirt: {
      pattern,
      base,
      sleeves: rnd() < p.contrastSleevesProbability ? accent : base,
      cuffs: accent,
      collar: { type: pickCollar(rnd), color: accent },
    },
  };
  if (pattern !== 'plain') kit.shirt.detail = accent;

  if (garments.includes('shorts')) {
    const shortsBase = rnd() < p.contrastShortsProbability ? accent : base;
    kit.shorts = { base: shortsBase };
    if (rnd() < p.shortsTrimProbability) kit.shorts.trim = shortsBase === base ? accent : base;
  }
  if (garments.includes('socks')) {
    const socksBase = kit.shorts && rnd() < p.socksLikeShortsProbability ? kit.shorts.base : base;
    kit.socks = { base: socksBase };
    if (rnd() < p.socksBandProbability) kit.socks.band = socksBase === base ? accent : base;
  }
  return kit;
}

/** Colores institucionales generados por id (1 a 3, de la paleta, sin chocar entre sí). */
export function generateIdentity(id: string): IInstitutionIdentity {
  const rnd = rngFor(id, 'identity');
  const [w1, w2, w3] = KIT_PARAMS.identityColorCountWeights;
  const count = weightedPick([[1, w1], [2, w2], [3, w3]] as const, rnd);
  const colors: HexColor[] = [];
  for (let i = 0; i < count; i++) colors.push(pickFarColor(KIT_PALETTE, colors, rnd));
  return { colors };
}

/**
 * Genera las equipaciones que declara el deporte. Si se pasa `identity`, se usan
 * esos colores institucionales; si no, también se generan.
 *
 * Reglas (KIT_IDENTITY.md §6):
 *  - Titular: cuerpo del color principal, patrón ponderado.
 *  - Alternativa: blanco/negro o el segundo color, lejos de la titular. Casi siempre lisa.
 *  - Siguientes de campo (tercera): un color de la paleta lejos de las anteriores.
 *  - Especiales: paleta propia, lejos de todas las de campo y de las del mismo puesto.
 *  - Las opcionales aparecen con la probabilidad de KIT_PARAMS.
 */
export function generateInstitutionKits(id: string, spec: IKitSpec, identity?: IInstitutionIdentity): IInstitutionKits {
  assertKitSpec(spec);
  const ident = identity ?? generateIdentity(id);
  assertIdentity(ident);
  const colors = ident.colors;
  const p = KIT_PARAMS;

  const kits: IKitSet = {};
  const fieldDominants: HexColor[] = [];

  fieldKitSlots(spec).forEach((slot, idx) => {
    const rnd = rngFor(id, slot.id);
    if (!slot.required && rnd() >= p.optionalFieldProbability) return;

    let base: HexColor;
    let pattern: ShirtPattern;
    if (idx === 0) {
      base = colors[0];
      pattern = pickPattern(rnd);
    } else {
      if (idx === 1) {
        const neutrals = rnd() < 0.5 ? [KIT_WHITE, KIT_BLACK] : [KIT_BLACK, KIT_WHITE];
        const second = colors[1];
        const candidates = second === undefined
          ? neutrals
          : rnd() < p.awayUsesSecondColorProbability ? [second, ...neutrals] : [...neutrals, second];
        base = candidates.find((c) => minDeltaE(c, fieldDominants) >= p.clashDeltaE)
          ?? pickFarColor(KIT_PALETTE, fieldDominants, rnd);
      } else {
        base = pickFarColor(KIT_PALETTE, fieldDominants, rnd);
      }
      pattern = rnd() < p.alternativePlainProbability ? 'plain' : pickPattern(rnd);
    }
    const accent = accentFor(base, idx === 0 ? colors.slice(1) : colors);
    const kit = buildKit(rnd, base, accent, pattern, spec.garments);
    kits[slot.id] = kit;
    fieldDominants.push(shirtDominant(kit));
  });

  const byPosition = new Map<string, HexColor[]>();
  for (const slot of spec.slots) {
    if (slot.role !== 'special') continue;
    const rnd = rngFor(id, slot.id);
    if (!slot.required && rnd() >= p.optionalSpecialProbability) continue;

    const samePosition = byPosition.get(slot.position!) ?? [];
    const base = pickFarColor(SPECIAL_KIT_PALETTE, [...fieldDominants, ...samePosition], rnd);
    const pattern = rnd() < p.specialPlainProbability ? 'plain' : pickPattern(rnd);
    const kit = buildKit(rnd, base, accentFor(base, colors), pattern, spec.garments);
    kits[slot.id] = kit;
    samePosition.push(shirtDominant(kit));
    byPosition.set(slot.position!, samePosition);
  }

  assertKitSet(kits, spec);
  return { identity: { colors: [...colors] }, kits };
}
