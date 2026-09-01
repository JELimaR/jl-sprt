import { getStagesOfTournament, ITournamentConfig } from "../JSportModule/data";

/**
 * TournamentConfigStore es el registro en memoria de los `ITournamentConfig` de una
 * simulación. Es el análogo, para configs de torneos, de lo que `RankingStore` es para
 * rankings: mientras el `RankingStore` guarda "qué resultado produjo cada stage/torneo"
 * (contextos `rs_`, `tr_`, `fr_`, `ini_`), este store guarda "qué torneos existen y
 * cómo se relacionan".
 *
 * ¿Por qué hace falta? Ver docs/plans/RUNTIME_VALIDATIONS.md (§7). En resumen: la
 * validación intra-torneo (`verifyTournamentConfig`) solo ve UN config a la vez, así
 * que no puede ubicar la fuente `rs_<stageX>` cuando `stageX` pertenece a OTRO torneo
 * (el caso de torneos acoplados A→B). Con todos los configs registrados acá, se puede
 * construir el índice `stageId -> torneo` sobre el conjunto completo y resolver esas
 * dependencias cross-tournament.
 *
 * Es un registro EN MEMORIA (no una DB): resuelve la coordinación dentro de una corrida,
 * no la persistencia entre sesiones. Pero es el paso que la habilita después: una vez que
 * todos los configs viven acá con una API clara, serializarlos es un agregado natural.
 */
export class TournamentConfigStore {
  /** Config por `idConfig` del torneo. */
  private _byId: Map<string, ITournamentConfig> = new Map<string, ITournamentConfig>();

  /**
   * Índices derivados, cacheados. Se invalidan (se ponen en null) ante cualquier
   * mutación y se recomputan perezosamente la próxima vez que se piden.
   */
  private _stageIndex: Map<string, ITournamentConfig> | null = null;

  constructor() {}

  /**
   * Registra (o reemplaza) el config de un torneo por su `idConfig`.
   */
  set(config: ITournamentConfig): void {
    this._byId.set(config.idConfig, config);
    this._stageIndex = null; // invalida el índice derivado
  }

  /**
   * Obtiene el config de un torneo por su `idConfig`.
   */
  get(tournamentId: string): ITournamentConfig | undefined {
    return this._byId.get(tournamentId);
  }

  /**
   * ¿Existe un torneo registrado con ese `idConfig`?
   */
  has(tournamentId: string): boolean {
    return this._byId.has(tournamentId);
  }

  /**
   * Ids de los torneos registrados.
   */
  keys(): IterableIterator<string> {
    return this._byId.keys();
  }

  /**
   * Itera sobre los configs registrados (compatible con Map.forEach).
   */
  forEach(callbackfn: (value: ITournamentConfig, key: string) => void): void {
    this._byId.forEach(callbackfn);
  }

  /**
   * Cantidad de torneos registrados.
   */
  get size(): number {
    return this._byId.size;
  }

  /**
   * Todos los configs registrados, como array.
   */
  all(): ITournamentConfig[] {
    return Array.from(this._byId.values());
  }

  /**
   * Limpia el registro.
   */
  clear(): void {
    this._byId.clear();
    this._stageIndex = null;
  }

  /**
   * Índice `stageId -> torneo que contiene ese stage`, construido sobre TODOS los
   * configs registrados. Es la pieza que permite ubicar la fuente `rs_<stageX>` aunque
   * `stageX` pertenezca a otro torneo (validación cross-tournament, Fase A del plan).
   *
   * Se cachea y se invalida en cada `set`/`clear`.
   */
  getStageIndex(): Map<string, ITournamentConfig> {
    if (this._stageIndex) return this._stageIndex;

    const index = new Map<string, ITournamentConfig>();
    this._byId.forEach((config) => {
      getStagesOfTournament(config).forEach((stage) => {
        index.set(stage.idConfig, config);
      });
    });
    this._stageIndex = index;
    return index;
  }

  /**
   * Dado un origen del store de rankings (`rs_<stageId>` o `tr_<tournamentId>`),
   * devuelve el config del torneo que lo produce, o `undefined` si no está registrado.
   * El prefijo son 3 chars (`rs_`, `tr_`), igual que en el resto del código.
   */
  findProducerTournament(rankId: string): ITournamentConfig | undefined {
    const prefix = rankId.slice(0, 3);
    const sourceId = rankId.slice(3);
    if (prefix === 'tr_') {
      return this._byId.get(sourceId);
    }
    if (prefix === 'rs_') {
      return this.getStageIndex().get(sourceId);
    }
    return undefined;
  }
}
