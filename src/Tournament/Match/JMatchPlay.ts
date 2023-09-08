import JResult from "./JResult";
import { TeamMatch } from "../Team";


export default class JMatchPlay {
	_time: number;
	_result: JResult | undefined;
  _globalResult: JResult | undefined;
  _teamOne: TeamMatch | undefined;
  _teamTwo: TeamMatch | undefined;

	constructor(globalResult?: JResult) {
		this._time = -1;	
    this._globalResult = globalResult;
	}
	get time(): number { return this._time; }
	get result(): JResult | undefined {
		return this._result;
	}

  init(one: TeamMatch, two: TeamMatch) {
    this._time = 0;
    this._teamOne = one;
    this._teamTwo = two;
    this._result = new JResult(this._teamOne.id, this._teamTwo.id);
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

