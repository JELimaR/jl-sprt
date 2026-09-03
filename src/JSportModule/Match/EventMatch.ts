import { IJEventInfo, JDurativeEvent } from "jl-calendar";
import { A_Match } from "./A_Match";
import { IVolleyScore } from "../profiles/volleyball/VolleyScore";

export interface IJEventMatchInfo extends IJEventInfo {
  match: A_Match<any>;
}

/**
 * Evento de partido: es un evento CON DURACIÓN (JDurativeEvent).
 *
 * `dateTime` (= startDateTime) es el instante de inicio. Mientras el reloj del
 * calendario está dentro de su rango, cada intervalo hace un paso de la simulación
 * (`match.advance()`), de modo que se puede observar el partido "en juego" con su
 * marcador parcial (P3 de EVENT_TAXONOMY.md).
 *
 * Mapeo temporal: 1 intervalo del calendario = 1 paso de `A_Match.advance()`. El
 * partido se autotermina (su propio `advance()` llama a `finish()` al llegar al final),
 * así que `isFinished()` delega en el match. `maxDuration` es un tope de seguridad
 * (fin abierto): p. ej. vóley no tiene una duración fija.
 *
 * Compatibilidad: `execute()` se conserva como "correr el partido de una" (fallback),
 * para el flujo de avance clásico (getNextEvents + execute) y tests que aún lo usan.
 * El flujo por intervalos usa el motor `tick()`/`advanceIntervals()` del calendario.
 */
export class JEventMatch extends JDurativeEvent {
  private _match: A_Match<any>;

  /** Tope de seguridad en intervalos (fin real lo decide el match). */
  private static readonly SAFETY_MAX_INTERVALS = 500;

  constructor(emc: IJEventMatchInfo) {
    try {
      super(emc);
      this._match = emc.match;
    } catch (error) {
      console.log(emc)
      throw error
    }
  }

  get kind(): string { return 'match'; }
  get label(): string { return `${this._match.homeTeam.id} vs ${this._match.awayTeam.id}`; }

  /** Partido asociado a este evento. */
  get match(): A_Match<any> { return this._match; }

  get maxDuration(): number { return JEventMatch.SAFETY_MAX_INTERVALS; }

  /** El partido termina cuando su propio estado es 'finished'. */
  isFinished(): boolean { return this._match.isFinished; }

  // --- ciclo durativo (lo maneja el calendario intervalo a intervalo) ---

  start(): void {
    super.start();
    this._match.start();
  }

  advance(): void {
    super.advance();
    if (!this._match.isFinished) {
      this._match.advance();
    }
  }

  finish(): void {
    super.finish();
    // Si por algún motivo el reloj sale del rango antes de terminar, forzar cierre.
    if (!this._match.isFinished) {
      while (this._match.state !== 'finished') {
        this._match.advance();
      }
    }
  }

  private formatScore(score: number | IVolleyScore): string {
    // Si es un número (Fútbol, Basket, etc.)
    if (typeof score === 'number') {
      return score.toString().padStart(2, ' ');
    }

    // Si es Volleyball: "Sets (Puntos por set)"
    const sets = score.setsWon;
    const points = score.setPoints.join(' | ');
    return `${sets} Sets (${points})`;
  }

  /**
   * Fallback: simula el partido completo de una. Usado por el flujo de avance clásico
   * (getNextEvents + execute) y por tests. El flujo por intervalos NO usa esto: usa
   * start()/advance()/finish() a través de tick()/advanceIntervals().
   */
  execute(): void {
    if (this._match.state !== 'playing' && !this._match.isFinished) {
      this._match.start();
    }
    console.log(`playing match ${this._match.id}`);
    while (this._match.state !== 'finished') {
      this._match.advance();
    }
    console.log(`\tresult:`)
    const res = this._match.result;
    if (!res) throw new Error(`no se obtuvo un res`)
    console.log(`\t  ${this._match.homeTeam.id.padEnd(10)} : ${this.formatScore(res.teamOneScore.score)}`);
    console.log(`\t  ${this._match.awayTeam.id.padEnd(10)} : ${this.formatScore(res.teamTwoScore.score)}`);
  }
}
