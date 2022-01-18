import { TypeHalfWeekOfYear } from '../Logica/Calendar/types';
import Team from './Team';
import { JDateTime } from '../Logica/Calendar/JDateTime';


type TypeMatchState = 
	| 'created'
	| 'scheduled'
	| 'suspended'
	| 'reschuduled'
	| 'prev'
	| 'playing'
	| 'finished'

export default class JMatch {
	private static cid: number = 0;
	private static get newId(): number {
		JMatch.cid++;
		return JMatch.cid;
	}

	private _id: number;
	private _date: JDateTime | undefined;

	private _state: TypeMatchState = 'created';
	private _lcl: Team;
	private _vst: Team;

	constructor(lcl: Team, vst: Team, hw: TypeHalfWeekOfYear) {
		this._id = JMatch.newId;
		this._lcl = lcl;
		this._vst = vst;
	}

	get id(): number {return this._id}
	get lcl(): Team { return this._lcl }
	get vst(): Team { return this._vst }

	schedule(d: JDateTime): void {
		this._state = (this._state == 'suspended' || this._state == 'scheduled') ? 'reschuduled' : 'scheduled';
		this._date = d;
	}
}