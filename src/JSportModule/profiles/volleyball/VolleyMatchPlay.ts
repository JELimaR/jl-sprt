
import { TeamMatch } from "../../data/Team";
import { A_MatchPlay } from "../../Match/A_MatchPlay";
import { randomFloat } from "../../Match/randomSource";
import VolleyResult from "./VolleyResult";

/**
 * Simulación de un partido de volleyball.
 * Se juegan sets hasta que un equipo gane 3 (best of 5).
 * Sets 1-4: a 25 puntos con diferencia mínima de 2.
 * Set 5 (tie-break): a 15 puntos con diferencia mínima de 2.
 * 
 * Contrato temporal (homogéneo entre deportes): cada advance() representa UN INTERVALO
 * de calendario. `time` cuenta intervalos jugados; la conversión a minutos reales, si
 * hace falta, la hace el consumidor con la constante del calendario (jl-calendar), no
 * el deporte. En cada intervalo se juegan varios rallies (RALLIES_PER_INTERVAL), así la
 * duración total del partido en el calendario emerge de forma realista.
 *
 * Entre sets hay un DESCANSO: al cerrarse un set (si el partido no terminó), el
 * siguiente intervalo es de pausa (SET_BREAK_INTERVALS), sin jugar rallies.
 */
export default class VolleyMatchPlay extends A_MatchPlay<import('./VolleyScore').IVolleyScore> {

  /** Rallies (puntos) que se juegan por intervalo. Ajustable. */
  private static readonly RALLIES_PER_INTERVAL = 4;
  /** Intervalos de descanso entre sets (5 min / 5 = 1). */
  private static readonly SET_BREAK_INTERVALS = 1;

  private _currentSetPointsOne: number = 0;
  private _currentSetPointsTwo: number = 0;
  /** Intervalos de descanso entre sets pendientes por consumir. */
  private _breakLeft: number = 0;

  constructor(globalResult?: VolleyResult) {
    super(globalResult);
  }

  init(one: TeamMatch, two: TeamMatch) {
    this._time = 0;
    this._teamOne = one;
    this._teamTwo = two;
    this._result = new VolleyResult(this._teamOne.id, this._teamTwo.id);
    this._currentSetPointsOne = 0;
    this._currentSetPointsTwo = 0;
    this._breakLeft = 0;
  }

  /** Avanza un intervalo: descanso entre sets, o RALLIES_PER_INTERVAL rallies. */
  advance() {
    if (!this._result || !this._teamOne || !this._teamTwo)
      throw new Error('no se init el match');

    if (this.isFinished()) return;

    this._time += 1; // un intervalo más

    // Durante el descanso entre sets: consumir un intervalo de pausa, sin jugar.
    if (this._breakLeft > 0) {
      this._breakLeft--;
      return;
    }

    for (let r = 0; r < VolleyMatchPlay.RALLIES_PER_INTERVAL; r++) {
      if (this.isFinished()) break;
      const setClosed = this.playRally();
      // Si se cerró un set y el partido sigue, arranca el descanso: no más rallies este
      // intervalo, y los próximos SET_BREAK_INTERVALS serán de pausa.
      if (setClosed && !this.isFinished()) {
        this._breakLeft = VolleyMatchPlay.SET_BREAK_INTERVALS;
        break;
      }
    }
  }

  /** true si algún equipo ya ganó 3 sets. */
  private isFinished(): boolean {
    const result = this._result as VolleyResult;
    const s1 = result.getScore(this._teamOne!.id).setsWon;
    const s2 = result.getScore(this._teamTwo!.id).setsWon;
    return s1 >= 3 || s2 >= 3;
  }

  /** Simula un rally (un punto) y cierra el set si corresponde. Devuelve true si cerró un set. */
  private playRally(): boolean {
    const result = this._result as VolleyResult;
    const s1 = result.getScore(this._teamOne!.id).setsWon;
    const s2 = result.getScore(this._teamTwo!.id).setsWon;

    // Simular un rally
    if (randomFloat() < 0.52) {
      this._currentSetPointsOne++;
    } else {
      this._currentSetPointsTwo++;
    }

    // Verificar si el set terminó
    const isTieBreak = (s1 + s2) === 4;
    const targetPoints = isTieBreak ? 15 : 25;
    const p1 = this._currentSetPointsOne;
    const p2 = this._currentSetPointsTwo;

    if ((p1 >= targetPoints || p2 >= targetPoints) && Math.abs(p1 - p2) >= 2) {
      const setWinner = p1 > p2 ? this._teamOne!.id : this._teamTwo!.id;
      result.addSetResult(setWinner, Math.max(p1, p2), Math.min(p1, p2));
      this._currentSetPointsOne = 0;
      this._currentSetPointsTwo = 0;
      return true;
    }
    return false;
  }
}
