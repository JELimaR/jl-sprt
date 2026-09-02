import { getStagesOfTournament, ITournamentConfig } from "../JSportModule/data";
import { verifyCoupledTournaments } from "../JSportModule/data/ConfigVerify/verifyCoupledTournaments";
import { ITournamentFromGSGData, tournamentFromGSG } from "../JSportModule/GeneralStageGraph/tournamentFromGSG";

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
 *
 * VERIFICACIÓN AL REGISTRAR: `set(creator)` es el punto donde se verifica TODO en el
 * momento de crear los torneos (no se difieren errores a temporadas siguientes):
 *  1. `tournamentFromGSG(creator)` corre la verificación INDIVIDUAL completa del torneo
 *     (tournament + phases + stages + basestage + no-recross). Lanza si el config está mal.
 *  2. `verifyCoupledTournaments(...)` sobre el conjunto acumulado corre la verificación
 *     CROSS-TOURNAMENT (alineación temporal y ausencia de ciclos entre torneos acoplados).
 * El registro puro (sin verificar) es privado (`register`): solo lo usa `set` tras
 * verificar. Fuera del store, la única puerta de entrada es `set(creator, season)`.
 *
 * HISTORIAL: además del config ACTUAL por `idConfig`, guarda todas las versiones
 * registradas con su temporada (`getHistory`, `getBySeason`), igual que el
 * `RankingStore`. Registrar el mismo torneo en temporadas distintas (ej. una liga que
 * pasa de 6 a 12 equipos con los años) NO pierde las versiones previas. Es historial
 * EN MEMORIA de una corrida; la persistencia entre sesiones (DB) va en una capa aparte.
 */
/** Una versión histórica de un config: qué config y de qué temporada. */
export interface ITournamentConfigVersion {
  season: number;
  config: ITournamentConfig;
}

export class TournamentConfigStore {
  /** Config ACTUAL (más reciente) por `idConfig` del torneo. */
  private _byId: Map<string, ITournamentConfig> = new Map<string, ITournamentConfig>();

  /**
   * HISTORIAL por `idConfig`: todas las versiones que se fueron registrando, con su
   * temporada. Análogo al `_history` del RankingStore, pero para configs de torneo.
   * Permite consultar "cómo era este torneo en la temporada X" (getBySeason) o todas
   * sus versiones (getHistory). Es historial EN MEMORIA de una corrida; la persistencia
   * entre sesiones (DB) es responsabilidad de una capa externa.
   */
  private _history: Map<string, ITournamentConfigVersion[]> = new Map<string, ITournamentConfigVersion[]>();

  /**
   * Índices derivados, cacheados. Se invalidan (se ponen en null) ante cualquier
   * mutación y se recomputan perezosamente la próxima vez que se piden.
   */
  private _stageIndex: Map<string, ITournamentConfig> | null = null;

  constructor() {}

  /**
   * Registra un torneo A PARTIR DE SU CREATOR (el dibujo declarativo del GSG),
   * VERIFICÁNDOLO por completo en el momento:
   *  1. `tournamentFromGSG(creator)` -> config, con toda la verificación individual
   *     (lanza si el torneo está mal definido).
   *  2. registra el config resultante.
   *  3. `verifyCoupledTournaments` sobre TODOS los configs registrados -> verificación
   *     cross-tournament (alineación temporal + ciclos). Tolera productores aún no
   *     registrados (valida solo lo resoluble), así el orden de creación no importa.
   *
   * `season` es la temporada del torneo (viene de `info.season` en `Tournament.create`,
   * siempre disponible). Se usa para el historial: registrar el mismo `idConfig` en
   * temporadas distintas NO pierde las versiones anteriores (getHistory/getBySeason).
   *
   * Devuelve el `ITournamentConfig` construido para que el llamador lo reutilice sin
   * re-ejecutar `tournamentFromGSG`.
   */
  set(creator: ITournamentFromGSGData, season: number): ITournamentConfig {
    const config = tournamentFromGSG(creator); // (1) verificación individual completa
    this.register(config, season);             // (2) registro + historial
    verifyCoupledTournaments(this.all());      // (3) verificación cross-tournament
    return config;
  }

  /**
   * Registro PURO de un config ya construido (sin verificar). Uso INTERNO: solo lo
   * llama `set` tras verificar el creator. Actualiza el config actual y agrega la
   * versión al historial. No es parte de la API pública del store.
   */
  private register(config: ITournamentConfig, season: number): void {
    this._byId.set(config.idConfig, config);
    const hist = this._history.get(config.idConfig) || [];
    hist.push({ season, config });
    this._history.set(config.idConfig, hist);
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
   * Limpia el registro (actual + historial + índice).
   */
  clear(): void {
    this._byId.clear();
    this._history.clear();
    this._stageIndex = null;
  }

  /**
   * Historial completo de versiones de un torneo (por `idConfig`), en orden de
   * registro. Cada versión trae su temporada y su config. Vacío si nunca se registró.
   */
  getHistory(tournamentId: string): ITournamentConfigVersion[] {
    return this._history.get(tournamentId) || [];
  }

  /**
   * Config de un torneo tal como se registró en una temporada dada. Si hubo varias
   * versiones en la misma temporada, devuelve la última registrada para esa temporada.
   * `undefined` si no hay ninguna versión de ese torneo en esa temporada.
   */
  getBySeason(tournamentId: string, season: number): ITournamentConfig | undefined {
    const hist = this._history.get(tournamentId);
    if (!hist) return undefined;
    // recorrer de atrás hacia adelante: la última registrada para esa temporada gana.
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].season === season) return hist[i].config;
    }
    return undefined;
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
