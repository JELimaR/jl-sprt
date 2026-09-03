
import { TeamMatch } from "../../data/Team";
import { A_MatchPlay } from "../../Match/A_MatchPlay";
import { randomFloat } from "../../Match/randomSource";
import FootballResult from "./FootballResult";

/**
 * Simulación de un partido de fútbol.
 * Cada advance() representa un intervalo (5 min): genera goles con probabilidad
 * aleatoria y suma 5 minutos de juego. A la mitad del tiempo reglamentario hay un
 * ENTRETIEMPO: 3 intervalos (15 min) donde no se juega ni avanza el tiempo de juego,
 * solo se consume la pausa (para que la duración en el calendario sea realista).
 */
export default class FootballMatchPlay extends A_MatchPlay<number> {

  /** Minuto de juego en que arranca el entretiempo (mitad de los 80'). */
  private static readonly HALFTIME_AT_MINUTE = 40;
  /** Intervalos de descanso del entretiempo (15 min / 5 = 3). */
  private static readonly HALFTIME_INTERVALS = 3;

  /** Intervalos de descanso pendientes por consumir (0 = jugando). */
  private _breakLeft: number = 0;
  /** true una vez que ya se hizo el entretiempo (para no repetirlo). */
  private _halftimeDone: boolean = false;

  constructor(globalResult?: FootballResult) {
    super(globalResult);
  }

  init(one: TeamMatch, two: TeamMatch) {
    this._time = 0;
    this._teamOne = one;
    this._teamTwo = two;
    this._result = new FootballResult(this._teamOne.id, this._teamTwo.id);
    this._breakLeft = 0;
    this._halftimeDone = false;
  }

  advance() {
    if (!this._result || !this._teamOne || !this._teamTwo)
      throw new Error(`no se init el match`)

    // Durante el entretiempo: consumir un intervalo de pausa, sin jugar.
    if (this._breakLeft > 0) {
      this._breakLeft--;
      return;
    }

    // ¿Toca el entretiempo? (al llegar a la mitad, una sola vez)
    if (!this._halftimeDone && this._time >= FootballMatchPlay.HALFTIME_AT_MINUTE) {
      this._halftimeDone = true;
      this._breakLeft = FootballMatchPlay.HALFTIME_INTERVALS - 1; // este intervalo ya es de pausa
      return;
    }

    const result = this._result as FootballResult;
    const globalResult = this._globalResult as FootballResult | undefined;

    this._time += 5;
    if (randomFloat() < 0.10) {
      result.addScore(this._teamOne.id);
      globalResult?.addScore(this._teamOne.id);
    }
    if (randomFloat() < 0.08) {
      result.addScore(this._teamTwo.id);
      globalResult?.addScore(this._teamTwo.id);
    }
  }
}
