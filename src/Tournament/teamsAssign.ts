import { Ranking, IGenericRankItem } from "../JSportModule";
import Team from "../JSportModule/data/Team";
import { SimulationContext } from "./SimulationContext";
import Tournament from "./Tournament";

/**
 * teamsAssign — asignación de equipos con RESOLUCIÓN DIFERIDA (Fase B del plan; ver
 * docs/plans/RUNTIME_VALIDATIONS.md §6).
 *
 * `asignarTeams2` resuelve el ranking inicial (`ini_<id>`) COMPLETO al crear el torneo
 * y LANZA si algún origen no está en el store todavía (Falla F1). Eso funciona cuando
 * todos los orígenes son `fr_` (federaciones, sembradas antes). Falla con torneos
 * acoplados: p. ej. el torneo B cuyo `ini_` incluye "los 3ros de A" (`rs_<grupoA>`),
 * que no existe hasta que la fase de grupos de A termina durante la simulación.
 *
 * teamsAssign resuelve esto:
 *  - Los orígenes YA disponibles se resuelven de una.
 *  - Los orígenes DIFERIDOS (`rs_`/`tr_` que aún no están en el store) se esperan: se
 *    suscribe a cada uno vía `ctx.store.subscribe`. Cada vez que el store recibe uno de
 *    esos contextos (lo escribe el `Event_StageEnd`/`Tournament.getRelativeRank` del
 *    productor), se revisa si YA están todos; cuando sí, se construye y guarda el
 *    `ini_<id>` completo, en un solo `set` (el store no admite rankings parciales).
 *
 * Garantía de tiempo: el primer `Event_StageStart` del consumidor (que lee `ini_<id>`)
 * se dispara en su `hwStart`. Si el orden temporal es válido (lo valida
 * `verifyCoupledTournaments`), el `hwEnd` del productor es anterior, así que el `ini_`
 * ya estará completo cuando el consumidor arranque.
 *
 * Si NO hay orígenes diferidos, se comporta igual que `asignarTeams2` (resuelve y
 * guarda de inmediato).
 */
export const teamsAssign = (tournament: Tournament, ctx: SimulationContext): void => {
  const gsg = tournament.graph;

  // Items del ranking inicial (origin `ini_<id>`, pos 1..N), en orden.
  const items: IGenericRankItem[] = [];
  gsg.getInitialRankings().forEach((v) => v.getGenericRankItems().forEach((it) => items.push(it)));

  // Cada qualy item apunta a un origen (fr_/rs_/tr_) y una posición dentro de él.
  const qualyItems: IGenericRankItem[] = tournament.qualyGenericRankItemList;

  // Orígenes distintos que aún NO están en el store (diferidos).
  const pendingOrigins = new Set<string>();
  qualyItems.forEach((igri) => {
    if (!ctx.store.has(igri.origin)) pendingOrigins.add(igri.origin);
  });

  // Caso simple: todo resoluble ahora -> mismo comportamiento que asignarTeams2.
  if (pendingOrigins.size === 0) {
    buildAndStoreIni(tournament, ctx, items, qualyItems);
    return;
  }

  // Caso diferido: suscribirse a cada origen pendiente. Cuando llegue el último, se
  // arma el `ini_` completo. Guardamos las funciones de desuscripción para limpiarlas.
  const unsubscribers: Array<() => void> = [];
  let resolved = false;

  const tryResolve = () => {
    if (resolved) return;
    // ¿Están TODOS los orígenes disponibles ya?
    const allReady = qualyItems.every((igri) => ctx.store.has(igri.origin));
    if (!allReady) return;

    resolved = true;
    buildAndStoreIni(tournament, ctx, items, qualyItems);
    // limpiar suscripciones: ya no hacen falta.
    unsubscribers.forEach((off) => off());
  };

  pendingOrigins.forEach((origin) => {
    unsubscribers.push(ctx.store.subscribe(origin, () => tryResolve()));
  });
};

/**
 * Resuelve cada qualy item contra el store y guarda el `ini_<id>` completo. Asume que
 * todos los orígenes ya están disponibles (o lanza con diagnóstico si falta alguno).
 */
function buildAndStoreIni(
  tournament: Tournament,
  ctx: SimulationContext,
  items: IGenericRankItem[],
  qualyItems: IGenericRankItem[],
): void {
  const teams: Team[] = [];

  qualyItems.forEach((igri: IGenericRankItem) => {
    const sourceRanking = ctx.store.get(igri.origin);
    if (!sourceRanking) {
      const available = Array.from(ctx.store.keys()).sort();
      throw new Error(
        `teamsAssign: no se puede resolver el origen "${igri.origin}" (pos ${igri.pos}) ` +
        `del torneo "${tournament.config.idConfig}". Contextos disponibles: [${available.join(', ')}]`
      );
    }
    teams.push(sourceRanking.getFromPosition(igri.pos).team);
  });

  const ini = Ranking.fromTypeRanking({
    context: `ini_${tournament.config.idConfig}`,
    items,
    teams,
  });
  ctx.store.set(ini.context, ini);
}
