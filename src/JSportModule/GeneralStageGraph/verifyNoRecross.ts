import { GeneralStageGraph, PhaseNode } from "./GeneralStageGraph";
import { NodeAttributes } from "./GeneralStageGraph";
import { InitialNode, RankGroupNode, StageNode, IStageNodeData } from "./nodes";
import { ReOrderStageNode, TransferStageNode } from "./NoneStageNode";

// =============================================================================
// verifyNoRecross — Principio B: "no re-cruzar ramas bifurcadas".
//
// Ver docs/plans/PRINCIPLE_B_NO_RECROSS.md. La regla, en una frase:
//
//   El torneo tiene un ORDEN GLOBAL de ranking. Todo stage debe consumir como
//   fuentes un RANGO CONTIGUO de ese orden. Si un stage junta ramas que en el
//   orden global no son contiguas (hay un "hueco" ocupado por ramas que fueron a
//   otro stage), entonces está re-cruzando ramas que ya se habían separado.
//
// Cómo se modela el "orden global": cada RankGroup (RG) que fluye por el grafo
// lleva un INTERVALO DE LINAJE [lo, hi] = el rango de posiciones del ranking
// conceptual inicial del torneo del que desciende. Los RG iniciales reciben
// intervalos consecutivos (1..n1, n1+1..n2, ...). Al pasar por un stage:
//   - stages que BIFURCAN (group/playoff/table) y TRANSFER: los outputs heredan,
//     EN ORDEN, sub-intervalos contiguos del intervalo unido de sus fuentes. El
//     orden se preserva.
//   - REORDER: intercambia el orden de sus 2 fuentes. Esto ROMPE la contigüidad a
//     propósito; solo es legítimo si una de las fuentes es EXTERNA al torneo (no
//     tiene linaje interno). Un reOrder entre dos ramas internas es exactamente el
//     re-cruce que la regla prohíbe.
//
// La verificación recorre las fases en orden manteniendo, por cada RG activo, su
// intervalo de linaje, y comprueba que las fuentes de cada stage formen un
// intervalo contiguo.
// =============================================================================

/** Intervalo de linaje [lo, hi] en el orden global, o `null` si el RG es externo. */
type Lineage = { lo: number; hi: number } | null;

/**
 * Verifica el Principio B sobre un GSG ya construido. Lanza si detecta un
 * re-cruce (fuentes no contiguas) o un reOrder entre dos ramas internas.
 */
export function verifyNoRecross(gsg: GeneralStageGraph): void {
  const tournamentId = gsg.getTournamentId();

  // Orden de flujo global de cada RG: se construye recorriendo INI y luego cada
  // fase/stage en orden, agregando sus RG de salida. Es el orden en que los RG
  // "fluyen" por el torneo, que es el que usa el ruteo por índice. Sirve para
  // ordenar de forma coherente fuentes que provienen de productores distintos.
  const flowOrder = buildFlowOrder(gsg);
  const byFlow = (a: RankGroupNode, b: RankGroupNode) =>
    (flowOrder.get(a.getId()) ?? 0) - (flowOrder.get(b.getId()) ?? 0);

  // Linaje por id de RG. Se va actualizando fase a fase.
  const lineageByRg = new Map<string, Lineage>();

  // Semilla: los RG iniciales reciben intervalos de linaje consecutivos según su
  // orden. La EXTERNALIDAD se detecta desde el qualyRankList del InitialNode (no
  // desde el sourceData del RG, que ya perdió el origin: el InitialNode re-etiqueta
  // todo como 'ini_<tid>'). Un RG inicial es externo si alguna de las posiciones
  // del qualyRankList que le corresponden apunta a OTRO torneo (rs_/tr_ ajeno).
  // Las ramas externas reciben linaje `null` y quedan EXENTAS de la contigüidad
  // (pueden juntarse con cualquier bloque interno: caso copa / UEFA). Solo las
  // internas cuentan para el orden global; el cursor no avanza sobre externas.
  const externalIniRgIds = detectExternalInitialRgs(gsg, tournamentId);
  const iniRgs = orderedOutputRgs(gsg, gsg.getNode('ini'), byFlow);
  let cursor = 1;
  iniRgs.forEach((rg) => {
    if (externalIniRgIds.has(rg.getId())) {
      lineageByRg.set(rg.getId(), null);
      return;
    }
    const size = rg.data.sourceData.size;
    lineageByRg.set(rg.getId(), { lo: cursor, hi: cursor + size - 1 });
    cursor += size;
  });

  // Recorrido de fases en orden.
  gsg.phases.forEach((phase: PhaseNode) => {
    phase.stages.forEach((stage: StageNode<IStageNodeData>) => {
      const sourceRgs = orderedSourceRgs(gsg, stage, byFlow);
      const outputRgs = orderedOutputRgs(gsg, stage, byFlow);

      // Intervalos de linaje de las fuentes (ignora externas: linaje null).
      const sourceLineages = sourceRgs
        .map((rg) => lineageByRg.get(rg.getId()) ?? null)
        .filter((l): l is { lo: number; hi: number } => l !== null);

      // --- CHECK 1: las fuentes internas forman un intervalo CONTIGUO. ---
      // Si hay un hueco, este stage junta ramas que en el orden global fueron
      // separadas (algo en el medio fue ruteado a otro stage) => re-cruce.
      const merged = mergeIfContiguous(sourceLineages);
      if (merged === 'gap') {
        const detail = sourceRgs
          .map((rg) => `${rg.getId()}${describeLineage(lineageByRg.get(rg.getId()) ?? null)}`)
          .join(', ');
        throw new Error(
          `verifyNoRecross: el stage "${stage.getId()}" del torneo "${tournamentId}" ` +
          `re-cruza ramas ya bifurcadas: sus fuentes NO forman un rango contiguo del ` +
          `orden global del ranking (hay un hueco ocupado por ramas ruteadas a otro ` +
          `stage).\nFuentes: [${detail}].\nVer docs/plans/PRINCIPLE_B_NO_RECROSS.md`
        );
      }

      // --- CHECK 2: un reOrder solo es legítimo con una fuente EXTERNA. ---
      // reOrder intercambia el orden de dos ramas; hacerlo entre dos ramas
      // internas del mismo torneo re-cruza ramas ya separadas.
      if (stage instanceof ReOrderStageNode) {
        // "Externa" = fuente con linaje null (proviene de una rama externa del
        // ranking inicial, que se propagó como null por transfers/stages).
        const hasExternal = sourceRgs.some(
          (rg) => (lineageByRg.get(rg.getId()) ?? null) === null
        );
        if (!hasExternal) {
          throw new Error(
            `verifyNoRecross: el reOrder "${stage.getId()}" del torneo "${tournamentId}" ` +
            `intercambia dos ramas INTERNAS del mismo torneo. Un reOrder solo es válido ` +
            `cuando una de sus fuentes es externa (torneo acoplado). Reordenar dos ramas ` +
            `internas re-cruza ramas ya bifurcadas.\nVer docs/plans/PRINCIPLE_B_NO_RECROSS.md`
          );
        }
      }

      // --- Propagar el linaje a los RG de salida del stage. ---
      propagateLineage(stage, sourceRgs, outputRgs, lineageByRg, merged);
    });
  });
}

/**
 * Reparte el intervalo unido de las fuentes entre los RG de salida, EN ORDEN.
 * - transfer: pasa las fuentes tal cual (mismo linaje, mismo orden).
 * - reOrder: intercambia el orden de sus 2 outputs (refleja el swap real).
 * - resto (group/playoff/table y demás): reparte el intervalo unido en
 *   sub-intervalos contiguos según el `size` de cada output.
 */
function propagateLineage(
  stage: StageNode<IStageNodeData>,
  sourceRgs: RankGroupNode[],
  outputRgs: RankGroupNode[],
  lineageByRg: Map<string, Lineage>,
  merged: { lo: number; hi: number } | null | 'gap',
): void {
  // transfer: passthrough posicional. #outputs == #sources.
  if (stage instanceof TransferStageNode) {
    outputRgs.forEach((out, i) => {
      const src = sourceRgs[i];
      lineageByRg.set(out.getId(), src ? (lineageByRg.get(src.getId()) ?? null) : null);
    });
    return;
  }

  // reOrder: exactamente 2 fuentes y 2 outputs, intercambiados.
  if (stage instanceof ReOrderStageNode) {
    const l0 = sourceRgs[0] ? (lineageByRg.get(sourceRgs[0].getId()) ?? null) : null;
    const l1 = sourceRgs[1] ? (lineageByRg.get(sourceRgs[1].getId()) ?? null) : null;
    // getRanksGroups devuelve [r[1], r[0]] => el primer output hereda la 2da fuente.
    if (outputRgs[0]) lineageByRg.set(outputRgs[0].getId(), l1);
    if (outputRgs[1]) lineageByRg.set(outputRgs[1].getId(), l0);
    return;
  }

  // group/playoff/table (y cualquier otro que bifurque): reparte el intervalo
  // unido en sub-intervalos contiguos, en orden, según el size de cada output.
  // Si las fuentes eran todas externas (merged null) o hubo gap, los outputs
  // quedan sin linaje interno.
  if (merged === 'gap' || merged === null) {
    outputRgs.forEach((out) => lineageByRg.set(out.getId(), null));
    return;
  }
  let c = merged.lo;
  outputRgs.forEach((out) => {
    const size = out.data.sourceData.size;
    lineageByRg.set(out.getId(), { lo: c, hi: c + size - 1 });
    c += size;
  });
}

/**
 * Une una lista de intervalos si son contiguos y crecientes. Devuelve:
 *  - el intervalo unido si forman un rango contiguo (sin huecos ni solapes),
 *  - `null` si la lista está vacía (no hay fuentes internas),
 *  - `'gap'` si hay un hueco (los intervalos no son contiguos).
 * Ordena por `lo` antes de chequear, así el orden de llegada no importa.
 */
function mergeIfContiguous(
  intervals: { lo: number; hi: number }[],
): { lo: number; hi: number } | null | 'gap' {
  if (intervals.length === 0) return null;
  const sorted = [...intervals].sort((a, b) => a.lo - b.lo);
  let lo = sorted[0].lo;
  let hi = sorted[0].hi;
  for (let i = 1; i < sorted.length; i++) {
    // contiguo exige que el siguiente empiece justo después del actual.
    if (sorted[i].lo !== hi + 1) return 'gap';
    hi = sorted[i].hi;
  }
  return { lo, hi };
}

type RgComparator = (a: RankGroupNode, b: RankGroupNode) => number;

/** RG de salida de un nodo, ordenados por su posición en el flujo global. */
function orderedOutputRgs(gsg: GeneralStageGraph, node: NodeAttributes, byFlow: RgComparator): RankGroupNode[] {
  return gsg
    .getTargetNeigbhors(node)
    .filter((n): n is RankGroupNode => n instanceof RankGroupNode)
    .sort(byFlow);
}

/** RG fuente de un nodo, ordenados por su posición en el flujo global. */
function orderedSourceRgs(gsg: GeneralStageGraph, node: NodeAttributes, byFlow: RgComparator): RankGroupNode[] {
  return gsg
    .getSourceNeighbors(node)
    .filter((n): n is RankGroupNode => n instanceof RankGroupNode)
    .sort(byFlow);
}

/** Índice de emisión de un RG dentro de su nodo productor (id `r_<nodeId>_<i+1>`). */
function rgIndex(rg: RankGroupNode): number {
  const m = rg.getId().match(/_(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Construye el orden de flujo global de los RG: recorre INI y luego cada fase y
 * stage en orden de construcción, numerando sus RG de salida (ordenados por su
 * índice de emisión). Es el mismo orden que usa el ruteo por índice de
 * createPhaseNodes, y permite comparar RG que vienen de productores distintos.
 */
function buildFlowOrder(gsg: GeneralStageGraph): Map<string, number> {
  const order = new Map<string, number>();
  let n = 0;
  const numberOutputs = (node: NodeAttributes) => {
    gsg
      .getTargetNeigbhors(node)
      .filter((x): x is RankGroupNode => x instanceof RankGroupNode)
      .sort((a, b) => rgIndex(a) - rgIndex(b))
      .forEach((rg) => {
        if (!order.has(rg.getId())) order.set(rg.getId(), n++);
      });
  };
  numberOutputs(gsg.getNode('ini'));
  gsg.phases.forEach((phase: PhaseNode) => {
    phase.stages.forEach((stage) => numberOutputs(stage));
  });
  return order;
}

/**
 * Detecta los RG INICIALES externos. La externalidad vive en el qualyRankList del
 * InitialNode (el grafo re-etiqueta todo como `ini_<tid>` y pierde el origin). El
 * InitialNode reparte `qualyRankList` en bloques consecutivos según `rankGroups`;
 * el bloque k corresponde al RG inicial `r_ini_<k+1>`. Un RG es externo si ALGUNA
 * de las posiciones de su bloque tiene un origin que apunta a OTRO torneo
 * (`rs_`/`tr_` cuyo id no pertenece a este GSG). Los orígenes `fr_` (federación) e
 * `ini_`/`rs_` propios son internos.
 */
function detectExternalInitialRgs(gsg: GeneralStageGraph, tournamentId: string): Set<string> {
  const out = new Set<string>();
  const ini = gsg.getNode('ini');
  if (!(ini instanceof InitialNode)) return out;

  const qualy = ini.data.qualyRankList;
  const rankGroups = ini.data.rankGroups;
  let cursor = 0;
  rankGroups.forEach((n: number, k: number) => {
    const block = qualy.slice(cursor, cursor + n);
    cursor += n;
    const anyExternal = block.some((item) => isExternalOrigin(item.origin, tournamentId));
    if (anyExternal) out.add(`r_ini_${k + 1}`);
  });
  return out;
}

/**
 * ¿El origin de una posición del ranking inicial es EXTERNO a este torneo? Es
 * externo si referencia un `rs_`/`tr_` de OTRO torneo. Los orígenes `fr_`
 * (federación), `ini_<thisTid>` y `rs_<thisTid>...` son internos.
 */
function isExternalOrigin(origin: string, tournamentId: string): boolean {
  if (origin.startsWith('fr_')) return false;
  if (origin.startsWith(`ini_${tournamentId}`)) return false;
  if (origin.startsWith(`rs_${tournamentId}_`)) return false;
  if (origin.startsWith(`rs_${tournamentId}`)) return false;
  if (origin.startsWith(`tr_${tournamentId}`)) return false;
  // rs_/tr_ de otro torneo => externo.
  return origin.startsWith('rs_') || origin.startsWith('tr_');
}

function describeLineage(l: Lineage): string {
  return l === null ? '(externo)' : `[${l.lo}..${l.hi}]`;
}
