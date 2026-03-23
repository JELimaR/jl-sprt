
import { TeamMatch } from "../../data/Team";
import { A_MatchPlay } from "../../Match/A_MatchPlay";
import FootballResult from "./FootballResult";

/**
 * Simulación de un partido de fútbol.
 * Genera goles con probabilidad aleatoria por cada intervalo de tiempo.
 */
export default class FootballMatchPlay extends A_MatchPlay<number> {

  constructor(globalResult?: FootballResult) {
    super(globalResult);
  }

  init(one: TeamMatch, two: TeamMatch) {
    this._time = 0;
    this._teamOne = one;
    this._teamTwo = two;
    this._result = new FootballResult(this._teamOne.id, this._teamTwo.id);
  }

  advance() {
    if (!this._result || !this._teamOne || !this._teamTwo)
      throw new Error(`no se init el match`)

    const result = this._result as FootballResult;
    const globalResult = this._globalResult as FootballResult | undefined;

    this._time += 5;
    if (Math.random() < 0.10) {
      result.addScore(this._teamOne.id);
      globalResult?.addScore(this._teamOne.id);
    }
    if (Math.random() < 0.08) {
      result.addScore(this._teamTwo.id);
      globalResult?.addScore(this._teamTwo.id);
    }
  }
}
