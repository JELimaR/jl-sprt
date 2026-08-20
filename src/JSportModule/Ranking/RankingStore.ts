import { Ranking } from "./Ranking";

/**
 * RankingStore encapsula el almacenamiento de rankings con capacidad de historial.
 * Reemplaza al Map<string, Ranking> global, manteniendo compatibilidad con .get() y .set().
 * 
 * Internamente guarda:
 * - _current: el ranking más reciente por context (equivalente al Map anterior)
 * - _history: todos los rankings que se fueron guardando por context (para consultas históricas)
 */
export class RankingStore {
  private _current: Map<string, Ranking> = new Map();
  private _history: Map<string, Ranking[]> = new Map();

  /**
   * Guarda un ranking. Actualiza el current y agrega al historial.
   */
  set(context: string, ranking: Ranking): void {
    this._current.set(context, ranking);
    const hist = this._history.get(context) || [];
    hist.push(ranking);
    this._history.set(context, hist);
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
   * Limpia todo el store (current + historial).
   */
  clear(): void {
    this._current.clear();
    this._history.clear();
  }
}
