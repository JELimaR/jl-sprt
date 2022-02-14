
import { JDateTime } from '../../Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from '../../Calendar/DateTime/types';
import { arr2 } from '../types';
import JResult, { IJResultInfo } from './JResult';
import JTeam from '../JTeam';
import JMatch from './JMatch';

export interface IJSerieInfo {
	teamOne: JTeam;
	teamTwo: JTeam;
	isIV: boolean;
	hws: arr2<TypeHalfWeekOfYear>;
	// config: {temp: number}; // info en vez de config
	season: number,
	id: string;
	isNeutral: boolean;
}


export default class JSerie {
	_isIV: boolean = false;
	private _result: JResult;
	private _id: string;
	private _date: JDateTime | undefined;

	// private _state: TypeMatchState = 'created';
	private _teamOne: JTeam; // JTeamMatch
	private _teamTwo: JTeam;
	private _matches: JMatch[];

	constructor(isi: IJSerieInfo) {
		this._isIV = isi.isIV;
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
				allowedDraw: this._isIV,
				isNeutral: isi.isNeutral,
			})
		];

		if (this._isIV) {
			this._matches.push(
				new JMatch({
					homeTeam: this._teamTwo,
					awayTeam: this._teamOne,
					hw: isi.hws[1],
					temp: isi.season,
					id: `${this._id}-M2`,
					serie: this,
					allowedDraw: true,
					isNeutral: isi.isNeutral,
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

	get winner(): JTeam { 
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
	get loser(): JTeam { return (this.winner.id === this._teamTwo.id) ? this._teamOne : this._teamTwo }

}