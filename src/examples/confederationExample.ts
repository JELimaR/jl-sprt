import { JCalendar, JDateTime } from "jl-calendar";
import { createGSG, TInitialCreator, TPhaseCreator } from "../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData } from "../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { IGenericRankItem, Ranking } from "../JSportModule/Ranking";
import { SimulationContext } from "../Tournament/SimulationContext";
import Tournament from "../Tournament/Tournament";
import { asignarTeams2 } from "../Tournament/asignarTeams2";
import { FootballProfile } from "../JSportModule/profiles/football/FootballProfile";
import exampleAdvance from "./exampleAdvance";
import { getFederationRankings } from "./graphData01";

/**
 * confederationExample — dos torneos de CONFEDERACIÓN acoplados
 * (tipo Champions League + Europa League).
 *
 * TORNEO A ("Champions"): fase de grupos de 32 (8 grupos de 4).
 *   - Su ranking de salida (rs_) ordena por posición de grupo:
 *       pos 1..8 = 1ros, 9..16 = 2dos, 17..24 = 3ros, 25..32 = 4tos.
 *   - Los TERCEROS de A (posiciones 17..24) "bajan" al Torneo B.
 *
 * TORNEO B ("Europa"): ranking inicial de 40 equipos:
 *   - 8 = los 3ros de A (NO se conocen al inicio; son placeholders que
 *         referencian rs_<grupoA> pos 17..24, resueltos just-in-time por el store).
 *   - 32 = clasificados de las federaciones (van a la fase de grupos de B).
 *
 *   Flujo de B:
 *     Fase grupos de B (32 -> 8 grupos de 4).
 *     Cruce: 3ros de A (8) vs 2dos de grupo de B (8) -> 8 ganadores.
 *     Octavos: ganadores del cruce (8) vs 1ros de grupo de B (8).
 *     ... (para el ejemplo llegamos hasta octavos).
 *
 * POR QUÉ LOS 8 ENTRANTES VAN "ARRIBA" (rankGroupNumbers: [8, 32])
 * ---------------------------------------------------------------
 * Los 3ros de A NO juegan la fase de grupos de B: entran directo al cruce, así
 * que su camino al título es MÁS CORTO. En el sourceRank, "arriba" = mejor
 * sembrado. Un equipo que entra directo a una ronda avanzada no puede estar peor
 * sembrado que uno que será eliminado en la fase de grupos. Además,
 * `tournamentFromGSG` valida que "el último rank group inicial pueda llegar al
 * primer lugar" (el peor sembrado inicial debe tener camino al título); poner los
 * entrantes arriba respeta ambas cosas.
 *
 * Pero para el EMPAREJAMIENTO del cruce, los entrantes (3ros de A) deben quedar
 * POR DEBAJO de los 1ros de B: para eso se usa el ReOrderStageNode, que
 * intercambia dos rank groups. Ese es exactamente su propósito.
 *
 * ⚠️ ESTADO: NO FUNCIONAL TODAVÍA.
 * El Torneo A corre bien. El Torneo B NO puede ejecutarse hoy: su ranking inicial
 * de 40 incluye 8 equipos (los 3ros de A) que no se conocen al crear el torneo, y
 * `asignarTeams2` exige resolver el ranking inicial COMPLETO en ese momento (lanza
 * si falta cualquier origin). Este archivo deja el DISEÑO del Torneo B como
 * documentación ejecutable-parcial; el problema y las opciones para resolverlo
 * están en docs/plans/COUPLED_TOURNAMENTS.md. Por eso el runner solo corre A y se
 * limita a VALIDAR la estructura del GSG de B (createGSG), sin asignarle equipos.
 */

const SEASON = 1990;
const A_GROUP_STAGE_ID = 'confedA_p01_s01'; // <tournamentId>_p01_s01 (lo arma createGSG)

// =============================================================================
// TORNEO A — Champions COMPLETO: grupos de 32 -> eliminatoria (octavos a semis
// en UN solo playoff de 3 rondas, ida/vuelta) -> final (estadio neutral, fase
// aparte por ser partido único).
//
// Orden de rank groups tras la fase de grupos (8 grupos de 4):
//   [1ros(8), 2dos(8), 3ros(8), 4tos(8)].
//   - 1ros + 2dos (16) avanzan a la fase eliminatoria.
//   - 3ros (8) "bajarían" al Torneo B (acá se arrastran a FIN como rama aparte).
//   - 4tos (8) eliminados (se arrastran a FIN).
//
// CLAVE: un playoff con value:3 (roundsNumber=3) sobre 16 equipos hace octavos,
// cuartos y semis en un SOLO stage. Su getRanksGroupNumbers da [2,2,4,8]:
//   [finalistas(2), perdedores_semi(2), perdedores_cuartos(4), perdedores_octavos(8)].
// Los 2 finalistas van a la final (fase aparte, neutral). No hace falta una fase
// por ronda: un playoff ya encadena sus rondas internamente.
//
// Cada rama que no avanza se arrastra con `transfer` hasta el FinalNode (principio:
// toda rama se cierra explícitamente, no queda colgada).
// =============================================================================
function buildTournamentA(): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId: 'confedA',
    qualyrankList: championsQualyList(), // 32 mejores de las federaciones
    rankGroupNumbers: [32],
  };

  const phaseArr: TPhaseCreator[] = [
    // Fase 1: grupos. Produce [1ros(8), 2dos(8), 3ros(8), 4tos(8)].
    { id: 1, stages: [{ count: 1, stage: { type: 'group', value: 8, opt: 'h&a' } }] },

    // Fase 2: ELIMINATORIA (octavos->cuartos->semis) en un playoff de 3 rondas h&a.
    // 1ros+2dos (16) al playoff; 3ros y 4tos se arrastran.
    // Consume [1ros, 2dos, 3ros, 4tos]. playoff count2 value3 -> 4 RG:
    //   [finalistas(2), perd_semi(2), perd_cuartos(4), perd_octavos(8)].
    // Produce [finalistas(2), perd_semi(2), perd_cuartos(4), perd_octavos(8), 3ros(8), 4tos(8)].
    {
      id: 2,
      stages: [
        { count: 2, stage: { type: 'playoff', value: 3, opt: 'h&a' } }, // 1ros+2dos (16)
        { count: 1, stage: { type: 'transfer' } }, // 3ros (bajarían a B / eliminados)
        { count: 1, stage: { type: 'transfer' } }, // 4tos (eliminados)
      ],
    },

    // Fase 3: FINAL en estadio NEUTRAL (partido único). Los 2 finalistas juegan la
    // final; el resto se arrastra al FinalNode.
    // Consume [finalistas, perd_semi, perd_cuartos, perd_octavos, 3ros, 4tos].
    {
      id: 3,
      stages: [
        { count: 1, stage: { type: 'playoff', value: 1, opt: 'neutral' } }, // FINAL (2 -> campeón)
        { count: 1, stage: { type: 'transfer' } }, // perd_semi
        { count: 1, stage: { type: 'transfer' } }, // perd_cuartos
        { count: 1, stage: { type: 'transfer' } }, // perd_octavos
        { count: 1, stage: { type: 'transfer' } }, // 3ros
        { count: 1, stage: { type: 'transfer' } }, // 4tos
      ],
    },
  ];

  // Fechas reales por fase: grupos=6, eliminatoria(3 rondas h&a)=6, final(neutral)=1
  //  ->  total 13 fechas.
  return {
    name: 'Confed A - Champions',
    gsgData: { initialCreator: iniCreator, phaseArr },
    matchList: [10, 12, 14, 16, 18, 20, /*elim*/ 26, 28, 34, 36, 42, 44, /*final*/ 50],
    schedList: [8, 8, 8, 8, 8, 8, /*elim*/ 22, 22, 30, 30, 38, 38, /*final*/ 46],
    qualyRules: [],
  };
}

// =============================================================================
// TORNEO B — 40 equipos (8 entrantes de A + 32 de grupos), multi-fase
// =============================================================================
function buildTournamentB(): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId: 'confedB',
    qualyrankList: europaQualyList(), // 8 (3ros de A, arriba) + 32 (federaciones)
    rankGroupNumbers: [8, 32],         // [entrantesA(8), grupos(32)]
  };

  // Recordá el orden de rank groups que produce un StageGroup 8x4:
  //   [1ros(8), 2dos(8), 3ros(8), 4tos(8)]
  const phaseArr: TPhaseCreator[] = [
    // --- Fase 1: la fase de grupos de B; los entrantes esperan (transfer).
    // Consume 2 RG del INI: [entrantesA(8), grupos(32)].
    // Produce: [entrantesA(8), 1rosB(8), 2dosB(8), 3rosB(8), 4tosB(8)] (5 RG).
    {
      id: 1,
      stages: [
        { count: 1, stage: { type: 'transfer' } },              // entrantesA esperan
        { count: 1, stage: { type: 'group', value: 8, opt: 'h&a' } }, // 32 -> 8 grupos de 4
      ],
    },

    // --- Fase 2: REORDEN. El intercambio correcto es (entrantesA, 1rosB).
    // Consume 5: [entrantesA, 1rosB, 2dosB, 3rosB, 4tosB].
    // reOrder sobre (entrantesA,1rosB) -> (1rosB,entrantesA).
    // Produce: [1rosB(8), entrantesA(8), 2dosB(8), 3rosB(8), 4tosB(8)].
    //
    // POR QUÉ ESTE INTERCAMBIO (y no (1rosB,2dosB)):
    // El sembrado (sourceRank) pone a los entrantesA (3ros de A) ARRIBA de todo
    // porque saltean la fase de grupos (no pueden jugarla: al arrancar el torneo
    // ni siquiera se sabe quiénes son). Pero deportivamente los 1rosB están MEJOR
    // rankeados que los entrantesA dentro de B. El reOrder invierte ese par para
    // que 1rosB queden POR ENCIMA de entrantesA. Efecto secundario buscado: tras
    // el swap, entrantesA queda adyacente a 2dosB (idx1, idx2), que es justo el
    // cruce que sigue (3ros de A vs 2dos de B). Y 1rosB queda arriba, esperando
    // los octavos. (Este ejemplo NO es funcional todavía porque el reOrder está
    // deshabilitado; ver docs/plans/COUPLED_TOURNAMENTS.md.)
    {
      id: 2,
      stages: [
        { count: 2, stage: { type: 'reOrder', value: 0 } }, // (entrantesA,1rosB) -> (1rosB,entrantesA)
        { count: 1, stage: { type: 'transfer' } },   // 2dosB
        { count: 1, stage: { type: 'transfer' } },   // 3rosB
        { count: 1, stage: { type: 'transfer' } },   // 4tosB
      ],
    },

    // --- Fase 3: EL CRUCE. entrantesA + 2dosB (adyacentes) en un playoff.
    // Consume 5: [1rosB, entrantesA, 2dosB, 3rosB, 4tosB].
    // 1rosB esperan (transfer); entrantesA + 2dosB (16) al playoff.
    // playoff count2 (16 teams, 1 ronda h&a) -> [ganadores(8), perdedores(8)].
    // Produce: [1rosB(8), ganadores(8), perdedores(8), 3rosB(8), 4tosB(8)].
    {
      id: 3,
      stages: [
        { count: 1, stage: { type: 'transfer' } }, // 1rosB (esperan a octavos)
        { count: 2, stage: { type: 'playoff', value: 1, opt: 'h&a' } }, // entrantesA vs 2dosB
        { count: 1, stage: { type: 'transfer' } }, // 3rosB (eliminados, se arrastran a FIN)
        { count: 1, stage: { type: 'transfer' } }, // 4tosB (eliminados)
      ],
    },

    // --- Fase 4: ELIMINATORIA (octavos->cuartos->semis) en un playoff de 3 rondas.
    // Tras el cruce, 1rosB (idx0) y ganadores (idx1) ya quedan ADYACENTES, así que
    // NO hace falta un reOrder extra: van directo al playoff. (Este es el pago del
    // reOrder de la Fase 2: dejó 1rosB arriba, listos para engancharse con los
    // ganadores del cruce.)
    // Consume 5: [1rosB, ganadores, perdedores, 3rosB, 4tosB].
    // playoff count2 value3 (16 teams) -> 4 RG:
    //   [finalistas(2), perd_semi(2), perd_cuartos(4), perd_octavos(8)].
    // Produce: [finalistas(2), perd_semi(2), perd_cuartos(4), perd_octavos(8),
    //           perdedores_cruce(8), 3rosB(8), 4tosB(8)] (7 RG).
    {
      id: 4,
      stages: [
        { count: 2, stage: { type: 'playoff', value: 3, opt: 'h&a' } }, // 1rosB vs ganadores (16)
        { count: 1, stage: { type: 'transfer' } }, // perdedores del cruce
        { count: 1, stage: { type: 'transfer' } }, // 3rosB
        { count: 1, stage: { type: 'transfer' } }, // 4tosB
      ],
    },

    // --- Fase 5: FINAL de B en estadio NEUTRAL (partido único).
    // Los 2 finalistas juegan la final; el resto se arrastra al FinalNode.
    // Consume 7: [finalistas, perd_semi, perd_cuartos, perd_octavos, perd_cruce, 3rosB, 4tosB].
    {
      id: 5,
      stages: [
        { count: 1, stage: { type: 'playoff', value: 1, opt: 'neutral' } }, // FINAL (2 -> campeón de B)
        { count: 1, stage: { type: 'transfer' } }, // perd_semi
        { count: 1, stage: { type: 'transfer' } }, // perd_cuartos
        { count: 1, stage: { type: 'transfer' } }, // perd_octavos
        { count: 1, stage: { type: 'transfer' } }, // perdedores del cruce
        { count: 1, stage: { type: 'transfer' } }, // 3rosB
        { count: 1, stage: { type: 'transfer' } }, // 4tosB
      ],
    },
  ];

  // Fechas (fases reales): grupos=6, cruce(h&a)=2, eliminatoria(3 rondas h&a)=6,
  // final(neutral)=1. La fase de reorden (Fase 2) ocupa 0 fechas.
  // Total fechas reales = 6 + 2 + 6 + 1 = 15. La fase de grupos de B empieza
  // DESPUÉS de que termine la de A (hw 20).
  return {
    name: 'Confed B - Europa',
    gsgData: { initialCreator: iniCreator, phaseArr },
    matchList: [30, 32, 34, 36, 38, 40, /*cruce*/ 46, 48, /*elim*/ 54, 56, 62, 64, 70, 72, /*final*/ 78],
    schedList: [28, 28, 28, 28, 28, 28, /*cruce*/ 42, 42, /*elim*/ 50, 50, 58, 58, 66, 66, /*final*/ 74],
    qualyRules: [],
  };
}

// =============================================================================
// Listas de clasificados iniciales
// =============================================================================

/** 32 mejores para A: 1ros y 2dos de las federaciones (+ 3ros de las 4 primeras). */
function championsQualyList(): IGenericRankItem[] {
  const out: IGenericRankItem[] = [];
  for (let f = 1; f <= 14; f++) out.push({ origin: `fr_F${String(f).padStart(3, '0')}`, pos: 1 });
  for (let f = 1; f <= 14; f++) out.push({ origin: `fr_F${String(f).padStart(3, '0')}`, pos: 2 });
  for (let f = 1; f <= 4; f++) out.push({ origin: `fr_F${String(f).padStart(3, '0')}`, pos: 3 });
  return out;
}

/**
 * 40 para B, EN ORDEN (rankGroupNumbers [8, 32]):
 *   - primeros 8 = los 3ros de A (origin rs_<grupoA> pos 17..24). Van ARRIBA.
 *   - siguientes 32 = clasificados de federaciones que van a la fase de grupos.
 */
function europaQualyList(): IGenericRankItem[] {
  const out: IGenericRankItem[] = [];

  // 8 entrantes: los 3ros de la fase de grupos de A (posiciones 17..24 de su rs_).
  // Son placeholders: se resuelven cuando la fase de grupos de A termina.
  for (let pos = 17; pos <= 24; pos++) {
    out.push({ origin: `rs_${A_GROUP_STAGE_ID}`, pos });
  }

  // 32 de federaciones para la fase de grupos de B (posiciones más bajas que las de A).
  // 4tos..7mos de F001..F008 = 32 (no coinciden con los equipos de A).
  for (let pos = 4; pos <= 7; pos++) {
    for (let f = 1; f <= 8; f++) out.push({ origin: `fr_F${String(f).padStart(3, '0')}`, pos });
  }

  return out;
}

// =============================================================================
// Runner
// =============================================================================
export default function confederationExample() {
  console.log('-------------------- confederation example --------------------');

  // Un único contexto: MISMO calendario y MISMO store para ambos torneos.
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON).getIJDateTimeCreator());
  const ctx = new SimulationContext(cal);

  // 1) Sembrar rankings de federación (fr_F001..fr_F014).
  getFederationRankings(14).forEach((franking: Ranking) => ctx.store.set(franking.context, franking));

  // 2) Construir el Torneo A (funcional).
  const dataA = buildTournamentA();

  // 3) Torneo A: se crea, se asignan equipos y se juega normalmente.
  const tournamentA = Tournament.create({ id: 'confedA', season: SEASON }, dataA, ctx, new FootballProfile());
  asignarTeams2(tournamentA, ctx);

  // 4) Torneo B: su diseño está en buildTournamentB() como DOCUMENTACIÓN, pero NO
  //    se construye acá: usa `reOrder` (deshabilitado a propósito, ver
  //    COUPLED_TOURNAMENTS.md) y su ranking inicial depende de rs_<grupoA> que aún
  //    no existe. Construirlo lanzaría. Lo dejamos como referencia estructural.
  //    const dataB = buildTournamentB(); // <- no ejecutable hoy
  console.log('Torneo B: diseño documentado en buildTournamentB() (no ejecutable, ver COUPLED_TOURNAMENTS.md).');

  // 5) Avanzar el calendario: se juega la fase de grupos de A.
  exampleAdvance(cal);

  // 6) Resultados de A y los 3ros que "bajarían" a B.
  const rsA = ctx.store.get(`rs_${A_GROUP_STAGE_ID}`);
  if (rsA) {
    console.log('\nRanking de salida de la fase de grupos de A:');
    console.table(rsA.getRankTable().map((ri) => ({ pos: ri.pos, team: ri.team.id })));
    console.log('\nLos 3ros de A (posiciones 17..24) que bajarían al Torneo B:');
    console.table(
      rsA.getRankTable().filter((ri) => ri.pos >= 17 && ri.pos <= 24).map((ri) => ({ pos: ri.pos, team: ri.team.id }))
    );
  }

  console.log('\nRanking final de A:');
  console.table(tournamentA.getRelativeRank().getRankTable().map((ri) => ({ pos: ri.pos, team: ri.team.id })));

  console.log('\nTorneo B: estructura definida pero NO ejecutable aún (ver COUPLED_TOURNAMENTS.md).');
}
