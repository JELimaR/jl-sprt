
import { JDateTime } from '../../JCalendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from '../../JCalendar/DateTime/types';
import { arr2 } from '../types';
import JResult, { IJResultInfo } from './JResult';
import Team from '../Team';
import JMatch from './JMatch';
import { TypeBaseStageOption } from '../Stage/BaseStage';

export interface IJSerieInfo {
	teamOne: Team;
	teamTwo: Team;
	// isIV: boolean;
	hws: arr2<TypeHalfWeekOfYear>;
	// config: {temp: number}; // info en vez de config
	season: number,
	id: string;
	// isNeutral: boolean;
  opt: TypeBaseStageOption
}

export default class JSerie {

  _opt: TypeBaseStageOption
	// _isIV: boolean = false;
	private _result: JResult;
	private _id: string;
	private _date: JDateTime | undefined;

	// private _state: TypeMatchState = 'created';
	private _teamOne: Team; // JTeamMatch
	private _teamTwo: Team;
	private _matches: JMatch[];

	constructor(isi: IJSerieInfo) {
    this._opt = isi.opt;
		// this._isIV = isi.isIV;
		this._id = isi.id;
		this._teamOne = isi.teamOne;
		this._teamTwo = isi.teamTwo;
		this._result = new JResult(
			this._teamOne.id,
			this._teamTwo.id
		);

		this._matches = [
			new JMatch({
				homeTeam: this._teamOne,
				awayTeam: this._teamTwo,
				hw: isi.hws[0],
				temp: isi.season,
				id: `${this._id}-M1`,
				serie: this,
				allowedDraw: this._opt == 'h&a',
				isNeutral: isi.opt == 'neutral',
			})
		];

		if (this._opt == 'h&a') {
			this._matches.push(
				new JMatch({
					homeTeam: this._teamTwo,
					awayTeam: this._teamOne,
					hw: isi.hws[1],
					temp: isi.season,
					id: `${this._id}-M2`,
					serie: this,
					allowedDraw: true,
					isNeutral: isi.opt == 'neutral',
				})
			)
		}
	}

	get id(): string { return this._id }
	get result(): JResult {return this._result }
	get matches(): JMatch[] { return this._matches }

	get isFinished(): boolean {
		return this._matches.every((m: JMatch) => m.state === 'finished');
	}

	get winner(): Team { 
		if (this._result.getResultInfo().teamWinner === 'none') throw new Error( `no hubo ganador en la serie`)
		let out = (this._result.getResultInfo().teamWinner === this._teamOne.id) ? this._teamOne : this._teamTwo;
		/*
		console.log('--------------ida-------------------');
		console.log(this._matches[0].result);
		console.log('------------vuelta------------------');
		console.log(this._matches[1].result);
		console.log('------------global------------------');
		console.log(this._result.getResultInfo());
		console.log(out.id);
		*/
		return out;
		
	}
	get loser(): Team { return (this.winner.id === this._teamTwo.id) ? this._teamOne : this._teamTwo }

}