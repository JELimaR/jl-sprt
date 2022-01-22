
import { JDateTime } from '../../Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from '../../Calendar/DateTime/types';
import JTeam from '../JTeam';
import JMatch from '../Match/JMatch';
import {arr2} from '../scheduling';

export interface IJSerieInfo {
	homeTeamI: JTeam;
	awayTeamI: JTeam;
	isIV: boolean;
	hws: arr2<TypeHalfWeekOfYear>;
	// config: {temp: number}; // info en vez de config
	temp: number
}


export default class JSerie {
	_isIV: boolean = false;
	// private _id: number;
	private _date: JDateTime | undefined;

	// private _state: TypeMatchState = 'created';
	private _homeTeamI: JTeam; // JTeamMatch
	private _awayTeamI: JTeam;

	constructor(isi: IJSerieInfo) {
		this._isIV = isi.isIV;
		this._homeTeamI = isi.homeTeamI;
		this._awayTeamI = isi.awayTeamI;

		if (this._isIV) {
			new JMatch({
				homeTeam: this._homeTeamI,
				awayTeam: this._awayTeamI,
				hw: isi.hws[0],
				temp: isi.temp
			})
			new JMatch({
				homeTeam: this._awayTeamI,
				awayTeam: this._homeTeamI,
				hw: isi.hws[1],
				temp: isi.temp
			})
		} else {
			new JMatch({
				homeTeam: this._homeTeamI,
				awayTeam: this._awayTeamI,
				hw: isi.hws[0],
				temp: isi.temp
			})
		}
	}
}