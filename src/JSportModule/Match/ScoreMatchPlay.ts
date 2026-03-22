
import { TeamMatch } from "../data/Team";
import { A_MatchPlay } from "./A_MatchPlay";
import ScoreResult from "./ScoreResult";

/**
 * Simulación de un partido de fútbol (goles).
 * Implementación concreta de A_MatchPlay.
 */
export default class ScoreMatchPlay extends A_MatchPlay<number> {

	constructor(globalResult?: ScoreResult) {
		super(globalResult);
	}

  init(one: TeamMatch, two: TeamMatch) {
    this._time = 0;
    this._teamOne = one;
    this._teamTwo = two;
    this._result = new ScoreResult(this._teamOne.id, this._teamTwo.id);
  }

	advance() {
    if (!this._result || !this._teamOne || !this._teamTwo)
      throw new Error(`no se init el match`)
    
		this._time += 5;
		if (Math.random() < 0.10) {
      this._result.addScore(this._teamOne.id);
      this._globalResult?.addScore(this._teamOne.id);
    }
		if (Math.random() < 0.08) {
      this._result.addScore(this._teamTwo.id);
      this._globalResult?.addScore(this._teamTwo.id);
    }
	}
}
