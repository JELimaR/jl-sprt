
import { TeamMatch } from "../../data/Team";
import { A_MatchPlay } from "../../Match/A_MatchPlay";
import AFResult from "./AFResult";

/**
 * Simulación de un partido de American Football.
 * TODO: Ajustar probabilidades y scoring (touchdowns, field goals, etc.)
 */
export default class AFMatchPlay extends A_MatchPlay<number> {

  constructor(globalResult?: AFResult) {
    super(globalResult);
  }

  init(one: TeamMatch, two: TeamMatch) {
    this._time = 0;
    this._teamOne = one;
    this._teamTwo = two;
    this._result = new AFResult(this._teamOne.id, this._teamTwo.id);
  }

  advance() {
    if (!this._result || !this._teamOne || !this._teamTwo)
      throw new Error(`no se init el match`)

    const result = this._result as AFResult;
    const globalResult = this._globalResult as AFResult | undefined;

    this._time += 5;
    if (Math.random() < 0.12) {
      result.addScore(this._teamOne.id);
      globalResult?.addScore(this._teamOne.id);
    }
    if (Math.random() < 0.10) {
      result.addScore(this._teamTwo.id);
      globalResult?.addScore(this._teamTwo.id);
    }
  }
}
