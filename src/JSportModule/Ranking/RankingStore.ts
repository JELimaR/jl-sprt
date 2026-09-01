import { Ranking } from "./Ranking";

/**
 * RankingStore encapsula el almacenamiento de rankings con capacidad de historial.
 * Reemplaza al Map<string, Ranking> global, manteniendo compatibilidad con .get() y .set().
 * 
 * Internamente guarda:
 * - _current: el ranking más reciente por context (equivalente al Map anterior)
 * - _history: todos los rankings que se fueron guardando por context (para consultas históricas)
 */
/** Callback que se dispara cuando se guarda un ranking en un context suscrito. */
export type RankingStoreListener = (context: string, ranking: Ranking) => void;

export class RankingStore {
  private _current: Map<string, Ranking> = new Map<string, Ranking>();
  private _history: Map<string, Ranking[]> = new Map<string, Ranking[]>();
  /** Suscriptores por context. Se notifican en cada `set` de ese context. */
  private _listeners: Map<string, RankingStoreListener[]> = new Map<string, RankingStoreListener[]>();

  constructor() {}

  /**
   * Guarda un ranking. Actualiza el current, agrega al historial y notifica a los
   * suscriptores de ese context (si los hay).
   */
  set(context: string, ranking: Ranking): void {
    if (!ranking.isBlocked) {
      throw new Error(`Solo se pueden guardar rankings bloqueados (poblados con teams). ` +
        `El ranking "${ranking.context}" no esta bloqueado. en RankingStore.set`);
    }
    this._current.set(context, ranking);
    const hist = this._history.get(context) || [];
    hist.push(ranking);
    this._history.set(context, hist);

    // Notificar a los suscriptores de este context. Es el punto de enganche para la
    // resolución diferida de equipos (teamsAssign): cuando un stage/torneo escribe su
    // `rs_`/`tr_`, un consumidor que esperaba ese origen puede completarse.
    const listeners = this._listeners.get(context);
    if (listeners) {
      // copia defensiva: un listener podría suscribir/desuscribir durante la iteración
      [...listeners].forEach((cb) => cb(context, ranking));
    }
  }

  /**
   * Suscribe un callback a las escrituras (`set`) de un context dado. Devuelve una
   * función para desuscribirse. Si el context ya existe en el store al momento de
   * suscribir, el callback NO se dispara retroactivamente (solo ante futuros `set`).
   */
  subscribe(context: string, listener: RankingStoreListener): () => void {
    const arr = this._listeners.get(context) || [];
    arr.push(listener);
    this._listeners.set(context, arr);

    return () => {
      const current = this._listeners.get(context);
      if (!current) return;
      const idx = current.indexOf(listener);
      if (idx >= 0) current.splice(idx, 1);
      if (current.length === 0) this._listeners.delete(context);
    };
  }

  /**
   * Obtiene el ranking actual (más reciente) para un context dado.
   */
  get(context: string): Ranking | undefined {
    return this._current.get(context);
  }

  /**
   * Verifica si existe un ranking para el context dado.
   */
  has(context: string): boolean {
    return this._current.has(context);
  }

  /**
   * Obtiene todo el historial de rankings para un context dado.
   */
  getHistory(context: string): Ranking[] {
    return this._history.get(context) || [];
  }

  /**
   * Busca un ranking en el historial por context y season (requiere metadata.season).
   */
  getBySeason(context: string, season: number): Ranking | undefined {
    const hist = this._history.get(context) || [];
    return hist.find(r => r.metadata?.season === season);
  }

  /**
   * Devuelve las keys del mapa current.
   */
  keys(): IterableIterator<string> {
    return this._current.keys();
  }

  /**
   * Cantidad de rankings almacenados (current).
   */
  get size(): number {
    return this._current.size;
  }

  /**
   * Itera sobre los rankings actuales (current), compatible con Map.forEach.
   */
  forEach(callbackfn: (value: Ranking, key: string) => void): void {
    this._current.forEach(callbackfn);
  }

  /**
   * Limpia todo el store (current + historial + suscriptores).
   */
  clear(): void {
    this._current.clear();
    this._history.clear();
    this._listeners.clear();
  }
}
