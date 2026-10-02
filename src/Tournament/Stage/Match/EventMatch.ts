import { IJEventInfo, JDurativeEvent } from "jl-calendar";
import { AnyMatch } from "jl-sprt-core";

export interface IJEventMatchInfo extends IJEventInfo {
  match: AnyMatch;
}

/**
 * Evento de partido: es un evento CON DURACIÓN (JDurativeEvent).
 *
 * `dateTime` (= startDateTime) es el instante de inicio. Mientras el reloj del
 * calendario está dentro de su rango, cada intervalo hace un paso de la simulación
 * (`match.advance()`), de modo que se puede observar el partido "en juego" con su
 * marcador parcial (P3 de EVENT_TAXONOMY.md).
 *
 * Mapeo temporal (simple y homogéneo): 1 intervalo del calendario = 1
 * `match.advance()`, y cada `advance()` de la simulación representa 5 minutos de juego
 * (contrato de AnyMatchPlay). Así la duración del partido en el calendario EMERGE de la
 * propia simulación (fútbol termina a los ~90 min de juego → ~18 intervalos; vóley
 * juega ~4 rallies por intervalo y termina cuando alguien gana 3 sets → duración
 * variable pero realista). No se declara duración por deporte.
 *
 * `isFinished()` delega en el partido (se autotermina). `maxDuration` es solo un tope
 * de seguridad amplio para el calendario (evitar rangos infinitos).
 *
 * Compatibilidad: `execute()` se conserva como "correr el partido de una" (fallback),
 * para el flujo de avance clásico (getNextEvents + execute) y tests que aún lo usan.
 * El flujo por intervalos usa el motor `tick()`/`advanceIntervals()` del calendario.
 */
export class JEventMatch extends JDurativeEvent {
  private _match: AnyMatch;

  /** Tope de seguridad en intervalos (el fin real lo decide el partido). */
  private static readonly SAFETY_MAX_INTERVALS = 1000;

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
  get label(): string { return `${this._match.homeTeam.name} vs ${this._match.awayTeam.name}`; }

  /** Partido asociado a este evento. */
  get match(): AnyMatch { return this._match; }

  /** Tope de seguridad; el fin efectivo lo da isFinished() (el partido se autotermina). */
  get maxDuration(): number { return JEventMatch.SAFETY_MAX_INTERVALS; }

  /** El partido termina cuando su propia lógica lo da por finalizado. */
  isFinished(): boolean { return this._match.isFinished; }

  // --- ciclo durativo (lo maneja el calendario intervalo a intervalo) ---

  start(): void {
    super.start();
    this._match.start();
  }

  advance(): void {
    // tiene setnido avanzar sin verificar antes si el evento termino?
    super.advance();
    // 1 intervalo de calendario = 1 advance() del partido (= 5 min de juego).
    if (!this._match.isFinished) {
      this._match.advance();
      if (this._match.isFinished) {
        this.finish();
      }
    }
  }

  finish(): void {
    super.finish();
    // Seguridad: si el reloj cerró el rango antes de tiempo, drenar hasta el final.
    let guard = 0;
    while (this._match.state !== 'finished') {
      this._match.advance();
      if (++guard > 100000) throw new Error(`el partido ${this._match.id} no termina`);
    }
  }

  /**
   * Descripción legible del evento, para OBSERVACIÓN (logs de examples vía el
   * observer del calendario). NO imprime: devuelve el texto. El marcador lo provee el
   * propio match (`describeScore()`, bloque de 2 líneas home/away).
   */
  describe(): string {
    return `partido ${this._match.id}\n${this._match.describeScore()}`;
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
    while (this._match.state !== 'finished') {
      this._match.advance();
    }
  }
}
