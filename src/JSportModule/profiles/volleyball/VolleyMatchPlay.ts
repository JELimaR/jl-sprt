
import { TeamMatch } from "../../data/Team";
import { A_MatchPlay } from "../../Match/A_MatchPlay";
import VolleyResult from "./VolleyResult";

/**
 * Simulación de un partido de volleyball.
 * Se juegan sets hasta que un equipo gane 3 (best of 5).
 * Sets 1-4: a 25 puntos con diferencia mínima de 2.
 * Set 5 (tie-break): a 15 puntos con diferencia mínima de 2.
 * 
 * Cada advance() simula un rally (punto).
 * time = número total de rallies jugados.
 */
export default class VolleyMatchPlay extends A_MatchPlay<import('./VolleyScore').IVolleyScore> {

  private _currentSetPointsOne: number = 0;
  private _currentSetPointsTwo: number = 0;

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
  }

  advance() {
    if (!this._result || !this._teamOne || !this._teamTwo)
      throw new Error('no se init el match');

    const result = this._result as VolleyResult;
    const s1 = result.getScore(this._teamOne.id).setsWon;
    const s2 = result.getScore(this._teamTwo.id).setsWon;

    // Partido terminado si alguien tiene 3 sets
    if (s1 >= 3 || s2 >= 3) return;

    this._time++;

    // Simular un rally
    if (Math.random() < 0.52) {
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
      const setWinner = p1 > p2 ? this._teamOne.id : this._teamTwo.id;
      result.addSetResult(setWinner, Math.max(p1, p2), Math.min(p1, p2));
      this._currentSetPointsOne = 0;
      this._currentSetPointsTwo = 0;
    }
  }
}
