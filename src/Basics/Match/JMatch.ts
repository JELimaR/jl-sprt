import { TypeHalfWeekOfYear } from '../../Calendar/DateTime/types';
import { IJLeagueConfig } from '../JLeague';
import JTeam from '../JTeam';
import { JDateTime } from '../../Calendar/DateTime/JDateTime';
import JCalendar from '../../Calendar/JCalendar';

export type TypeMatchState =
	| 'created'
	| 'scheduled'
	| 'suspended'
	| 'reschuduled'
	| 'prev'
	| 'playing'
	| 'finished';

export interface IJMatchInfo {
	homeTeam: JTeam;
	awayTeam: JTeam;
	hw: TypeHalfWeekOfYear;
	// config: IJLeagueConfig; // info en vez de config
	temp: number;
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
	private _homeTeam: JTeam; // JTeamMatch
	private _awayTeam: JTeam;

	private _playing: JMatchPlaying;

	constructor(imi: IJMatchInfo) {
		this._id = JMatch.newId;
		this._homeTeam = imi.homeTeam;
		this._awayTeam = imi.awayTeam;
		this._date = JDateTime.halfWeekOfYearToDateTime( imi.hw, imi.temp, 'middle' );

		this._playing = new JMatchPlaying();
	}

	get id(): number {
		return this._id;
	}
	get homeTeam(): JTeam {
		return this._homeTeam;
	}
	get awayTeam(): JTeam {
		return this._awayTeam;
	}

	get state(): TypeMatchState {
		return this._state;
	}

	schedule(d: JDateTime): void {
		this._state =
			this._state == 'suspended' || this._state == 'scheduled'
				? 'reschuduled'
				: 'scheduled';
		this._date = d.copy();
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

	get result(): IJMatchResultInfo {
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
	get result(): IJMatchResultInfo {
		return this._result.getResultInfo();
	}

	advance() {
		this._time += 5;
		if (Math.random() < 0.10) this._result.addHomeScore();
		if (Math.random() < 0.08) this._result.addAwayScore();
	}
}

export interface IJMatchResultInfo {
	homeScore: number;
	awayScore: number;
	winner: 'L' | 'V' | 'E';
}

class JMatchResult {
	_homeScore: number = 0;
	_awayScore: number = 0;

	constructor() { }

	addHomeScore() { this._homeScore++ }
	addAwayScore() { this._awayScore++ }

	getResultInfo(): IJMatchResultInfo {
		const w = (this._homeScore > this._awayScore) ? 'L' : ((this._homeScore < this._awayScore) ? 'V' : 'E')
		return {
			homeScore: this._homeScore,
			awayScore: this._awayScore,
			winner: w
		}
	}
}
