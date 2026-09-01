import { getStagesOfTournament, IStageConfig, ITournamentConfig } from "../../data";

/**
 * Validación CROSS-TOURNAMENT (Fase A del plan; ver docs/plans/RUNTIME_VALIDATIONS.md §6).
 *
 * `verifyTournamentConfig` solo ve UN config a la vez, así que no puede validar
 * dependencias entre torneos distintos (el caso de torneos acoplados A→B, donde B
 * consume `rs_<stageDeA>`). Esta función recibe el CONJUNTO de configs y valida lo que
 * necesita el acoplamiento:
 *
 *  1. Construye el grafo de dependencias entre torneos (A→B si B consume un `rs_`/`tr_`
 *     producido por A).
 *  2. Detecta ciclos (un ciclo haría imposible ordenar la construcción/simulación).
 *  3. Deriva un orden topológico = orden en que hay que construir y simular.
 *  4. Verifica la alineación temporal: la fuente (stage/torneo productor) debe TERMINAR
 *     antes de que ARRANQUE el stage consumidor, en half-weeks del calendario compartido.
 *
 * Es análisis puro de config, sin tocar runtime. Se apoya en el mismo criterio de
 * prefijos (`rs_`, `tr_`) que el resto del código.
 */

/** Referencia a una fuente cross-tournament resuelta contra el conjunto de configs. */
interface CrossDependency {
  /** Torneo que consume la fuente. */
  consumer: ITournamentConfig;
  /** Stage (dentro de `consumer`) que declara el `qualifyConditions` con la fuente. */
  consumerStage: IStageConfig;
  /** Torneo que produce la fuente (otro torneo del conjunto). */
  producer: ITournamentConfig;
  /** rankId original (ej. `rs_<stageId>` o `tr_<tournamentId>`). */
  rankId: string;
  /**
   * hw en que la fuente queda disponible: el `hwEnd` del stage productor (para `rs_`),
   * o el `hwEnd` del torneo productor (para `tr_`).
   */
  producerReadyHw: number;
}

/** Índices derivados del conjunto de configs. */
interface ConfigIndex {
  /** idConfig del torneo -> config. */
  byTournamentId: Map<string, ITournamentConfig>;
  /** idConfig del stage -> torneo que lo contiene. */
  stageToTournament: Map<string, ITournamentConfig>;
  /** idConfig del stage -> el propio stage. */
  stageById: Map<string, IStageConfig>;
}

function buildIndex(configs: ITournamentConfig[]): ConfigIndex {
  const byTournamentId = new Map<string, ITournamentConfig>();
  const stageToTournament = new Map<string, ITournamentConfig>();
  const stageById = new Map<string, IStageConfig>();

  configs.forEach((config) => {
    byTournamentId.set(config.idConfig, config);
    getStagesOfTournament(config).forEach((stage) => {
      stageToTournament.set(stage.idConfig, config);
      stageById.set(stage.idConfig, stage);
    });
  });

  return { byTournamentId, stageToTournament, stageById };
}

/**
 * Extrae las dependencias CROSS-tournament: recorre todas las stages de todos los
 * torneos y, por cada `qualifyConditions.rankId` de tipo `rs_`/`tr_` cuyo productor sea
 * OTRO torneo del conjunto, registra una dependencia. Las fuentes intra-torneo (mismo
 * config) las ignora: de eso se ocupa `verifyTournamentConfig`.
 */
function extractCrossDependencies(configs: ITournamentConfig[], index: ConfigIndex): CrossDependency[] {
  const deps: CrossDependency[] = [];

  configs.forEach((consumer) => {
    getStagesOfTournament(consumer).forEach((consumerStage) => {
      consumerStage.qualifyConditions.forEach((qc) => {
        const prefix = qc.rankId.slice(0, 3);
        const sourceId = qc.rankId.slice(3);

        let producer: ITournamentConfig | undefined;
        let producerReadyHw: number | undefined;

        if (prefix === 'rs_') {
          producer = index.stageToTournament.get(sourceId);
          const producerStage = index.stageById.get(sourceId);
          producerReadyHw = producerStage?.hwEnd;
        } else if (prefix === 'tr_') {
          producer = index.byTournamentId.get(sourceId);
          producerReadyHw = producer?.hwEnd;
        }

        // Solo interesa si el productor existe en el conjunto Y es OTRO torneo.
        if (producer && producer.idConfig !== consumer.idConfig && producerReadyHw !== undefined) {
          deps.push({ consumer, consumerStage, producer, rankId: qc.rankId, producerReadyHw });
        }
      });
    });
  });

  return deps;
}

/**
 * Orden topológico de los torneos según sus dependencias cross-tournament (A antes que B
 * si B depende de A). Lanza si hay un ciclo. Los torneos sin dependencias entre sí
 * quedan en un orden estable (el de entrada).
 */
export function resolveTournamentBuildOrder(configs: ITournamentConfig[]): ITournamentConfig[] {
  const index = buildIndex(configs);
  const deps = extractCrossDependencies(configs, index);

  // adyacencia: producer -> [consumers]
  const adj = new Map<string, Set<string>>();
  configs.forEach((c) => adj.set(c.idConfig, new Set()));
  deps.forEach((d) => adj.get(d.producer.idConfig)!.add(d.consumer.idConfig));

  // DFS con colores: 0 = sin visitar, 1 = en la pila (gris), 2 = terminado (negro).
  const color = new Map<string, number>();
  configs.forEach((c) => color.set(c.idConfig, 0));
  const order: string[] = [];
  const stack: string[] = []; // para reportar el ciclo

  const visit = (id: string) => {
    color.set(id, 1);
    stack.push(id);
    for (const next of adj.get(id)!) {
      const c = color.get(next);
      if (c === 1) {
        const cycleStart = stack.indexOf(next);
        const cycle = stack.slice(cycleStart).concat(next);
        throw new Error(
          `verifyCoupledTournaments: ciclo de dependencias entre torneos: ${cycle.join(' -> ')}. ` +
          `Los torneos acoplados no pueden depender circularmente unos de otros.`
        );
      }
      if (c === 0) visit(next);
    }
    stack.pop();
    color.set(id, 2);
    order.push(id); // post-orden
  };

  configs.forEach((c) => {
    if (color.get(c.idConfig) === 0) visit(c.idConfig);
  });

  // El post-orden da los productores DESPUÉS de sus consumidores; se invierte para que
  // los productores queden primero.
  order.reverse();
  const byId = index.byTournamentId;
  return order.map((id) => byId.get(id)!);
}

/**
 * Valida un conjunto de torneos acoplados. Lanza ante ciclos o desalineación temporal.
 * Devuelve `true` si el conjunto es coherente.
 */
export function verifyCoupledTournaments(configs: ITournamentConfig[]): boolean {
  const index = buildIndex(configs);
  const deps = extractCrossDependencies(configs, index);

  // 1 + 2 + 3: ciclos y orden topológico (lanza si hay ciclo).
  resolveTournamentBuildOrder(configs);

  // 4: alineación temporal. Para cada dependencia cross, la fuente debe estar disponible
  // (producerReadyHw) ANTES de que arranque el stage consumidor (consumerStage.hwStart).
  deps.forEach((d) => {
    if (d.producerReadyHw >= d.consumerStage.hwStart) {
      throw new Error(
        `verifyCoupledTournaments: desalineación temporal. La stage ${d.consumerStage.idConfig} ` +
        `del torneo ${d.consumer.idConfig} (hwStart=${d.consumerStage.hwStart}) consume ` +
        `"${d.rankId}" producido por el torneo ${d.producer.idConfig}, pero esa fuente recién ` +
        `queda disponible en hw=${d.producerReadyHw}. La fuente debe terminar ANTES de que ` +
        `arranque el stage que la consume.`
      );
    }
  });

  return true;
}
