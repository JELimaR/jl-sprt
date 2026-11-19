import { IKitSlotSpec, IKitSpec, fieldKitSlots, specialKitSlotsByPosition } from "jl-sprt-core";
import { HexColor, minDeltaE } from "./colorMath";
import { KIT_PARAMS } from "./kitPalette";
import { IKitSet, shirtDominant } from "./kitTypes";

/** Equipaciones que usa un equipo en un partido. */
export interface IMatchKitChoice {
  /** Id de la equipación de campo. */
  field: string;
  /** Id de la equipación de cada puesto especial ('goalkeeper' -> 'gk1'). */
  special: Record<string, string>;
}

export interface IMatchKitsSelection {
  home: IMatchKitChoice;
  away: IMatchKitChoice;
  /** true si el visitante no pudo usar su titular por choque con el local. */
  awayChanged: boolean;
}

/**
 * Entre las equipaciones disponibles (en orden de preferencia), la primera que no
 * choca con ninguno de `avoid`. Si todas chocan, la más lejana.
 */
function firstNotClashing(slots: readonly IKitSlotSpec[], kits: IKitSet, avoid: readonly HexColor[], threshold: number): string {
  const available = slots.filter((s) => kits[s.id] !== undefined);
  if (available.length === 0) throw new Error(`selectMatchKits: no kit available among [${slots.map((s) => s.id).join(', ')}]`);
  let best = available[0].id;
  let bestDist = -1;
  for (const slot of available) {
    const d = minDeltaE(shirtDominant(kits[slot.id]), avoid);
    if (d >= threshold) return slot.id;
    if (d > bestDist) { best = slot.id; bestDist = d; }
  }
  return best;
}

function selectSpecial(spec: IKitSpec, own: IKitSet, ownField: HexColor, opponentField: HexColor, threshold: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [position, slots] of specialKitSlotsByPosition(spec)) {
    // contrastWith se declara por equipación; dentro de un puesto se usa el de la primera.
    const targets = slots[0].contrastWith ?? [];
    const avoid: HexColor[] = [];
    if (targets.includes('own-field')) avoid.push(ownField);
    if (targets.includes('opponent-field')) avoid.push(opponentField);
    out[position] = firstNotClashing(slots, own, avoid, threshold);
  }
  return out;
}

/**
 * Elige qué equipación usa cada equipo en un partido (KIT_IDENTITY.md §7).
 *
 * - El local usa su titular.
 * - El visitante usa su titular salvo que choque con la del local; en ese caso la
 *   siguiente de campo que no choque.
 * - Cada puesto especial usa su primera equipación salvo que choque con lo que
 *   indica `contrastWith`.
 * - Choque: ΔE de los colores dominantes de camiseta menor a `threshold`. Pantalón y
 *   medias no cuentan.
 *
 * Función pura: no conoce deportes, sólo el `IKitSpec`.
 */
export function selectMatchKits(
  spec: IKitSpec, home: IKitSet, away: IKitSet, threshold: number = KIT_PARAMS.clashDeltaE,
): IMatchKitsSelection {
  const field = fieldKitSlots(spec);
  const homeField = firstNotClashing(field, home, [], threshold);
  const homeDominant = shirtDominant(home[homeField]);

  const awayField = firstNotClashing(field, away, [homeDominant], threshold);
  const awayDominant = shirtDominant(away[awayField]);
  const awayFirst = field.find((s) => away[s.id] !== undefined)!.id;

  return {
    home: { field: homeField, special: selectSpecial(spec, home, homeDominant, awayDominant, threshold) },
    away: { field: awayField, special: selectSpecial(spec, away, awayDominant, homeDominant, threshold) },
    awayChanged: awayField !== awayFirst,
  };
}
