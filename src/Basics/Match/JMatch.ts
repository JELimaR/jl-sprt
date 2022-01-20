import { TypeHalfWeekOfYear } from '../../Logica/DateTimeClasses/types';
import JTeam from '../JTeam';
import { JDateTime } from '../../Logica/DateTimeClasses/JDateTime';
import JCalendar from '../../Logica/JCalendar';

export type TypeMatchState =
	| 'created'
	| 'scheduled'
	| 'suspended'
	| 'reschuduled'
	| 'prev'
	| 'playing'
	| 'finished';

export interface IJMatch {
	l: any;
	v: any;
}

export default class JMatch {
	private static cid: number = 0;
	private static get newId(): number {
		JMatch.cid++;
		return JMatch.cid;
	}

	private _id: number;
	private _date: JDateTime | undefined;

	private _state: TypeMatchState = 'created';
	private _lcl: JTeam; // JTeamMatch
	private _vst: JTeam;

	private _playing: JMatchPlaying;

	constructor(lcl: JTeam, vst: JTeam/*, hw: TypeHalfWeekOfYear*/) {
		this._id = JMatch.newId;
		this._lcl = lcl;
		this._vst = vst;

		this._playing = new JMatchPlaying();
	}

	get id(): number {
		return this._id;
	}
	get lcl(): JTeam {
		return this._lcl;
	}
	get vst(): JTeam {
		return this._vst;
	}

	get state(): TypeMatchState {
		return this._state;
	}

	schedule(d: JDateTime): void {
		this._state =
			this._state == 'suspended' || this._state == 'scheduled'
				? 'reschuduled'
				: 'scheduled';
		this._date = d;
	}

	// process
	start() {
		if (!(this._state === 'scheduled' || this._state === 'reschuduled')) throw new Error('Match is none scheduled')
		this._state = 'playing';
	}

	advance() {
		if (this._state !== 'playing') throw new Error('Match is none playing');
		this._playing.advance();
		if (this._playing.time === 80) this._state = 'finished';
	}

	get result(): JMatchResultInfo {
		return this._playing.result;
	}
}

class JMatchPlaying {
	_time: number;
	_result: JMatchResult;
	constructor() {
		this._time = 0;
		this._result = new JMatchResult();
	}
	get time(): number { return this._time; }
	get result(): JMatchResultInfo {
		return this._result.getResultInfo();
	}

	advance() {
		this._time += 5;
		if (Math.random() < 0.15) this._result.addLcl();
		if (Math.random() < 0.11) this._result.addVst();
	}
}

export interface JMatchResultInfo {
	lclGls: number;
	vstGls: number;
	winner: 'L' | 'V' | 'E';
}

class JMatchResult {
	_lcl: number = 0;
	_vst: number = 0;

	constructor() { }

	addLcl() { this._lcl++ }
	addVst() { this._vst++ }

	getResultInfo(): JMatchResultInfo {
		const w = (this._lcl > this._vst) ? 'L' : ((this._lcl < this._vst) ? 'V' : 'E')
		return {
			lclGls: this._lcl,
			vstGls: this._vst,
			winner: w
		}
	}
}