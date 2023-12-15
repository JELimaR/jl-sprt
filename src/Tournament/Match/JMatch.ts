import JSerie from './JSerie';
import JMatchPlay from './JMatchPlay';
import JResult, { IJResultInfo } from './JResult';
import { TypeHalfWeekOfYear, JDateTime } from '../../JCalendar/JDateTimeModule';
import Team from '../../JSportModule/data/Team';

export type TypeMatchState =
	| 'created'
	| 'scheduled'
	| 'postponed'
	| 'reschuduled'
	| 'prev'
	| 'playing'
	| 'finished';

export interface IMatchInfo {
	id: string;
	hw: TypeHalfWeekOfYear;
	season: number;
	homeTeam: Team;
	awayTeam: Team;

	serie?: JSerie;
	allowedDraw: boolean;
	isNeutral: boolean;
}

export default class Match /*implements IJSubject*/  {
	/*private static cid: number = 0;
	private static get newId(): number {
		JMatch.cid++;
		return JMatch.cid;
	}*/

  private _info: IMatchInfo;

	private _id: string;
	private _date: JDateTime;
	// private _observers: IJObserver<JMatch>[] = [];

	private _state: TypeMatchState = 'created';
	private _homeTeam: Team; // JTeamMatch
	private _awayTeam: Team;

	private _isNeutral: boolean;

	private _playing: JMatchPlay;

	private _serie?: JSerie;
	private _allowedDraw: boolean;

	constructor(imi: IMatchInfo) {
    this._info = {...imi};
		this._id = /*JMatch.newId;*/ imi.id;
		this._isNeutral = imi.isNeutral;

		this._homeTeam = imi.homeTeam;
		this._awayTeam = imi.awayTeam;
		
		this._date = JDateTime.createFromHalfWeekOfYearAndYear( imi.hw, imi.season, 'middle' );
		
		this._homeTeam.addNewMatch(this);
		this._awayTeam.addNewMatch(this);

		this._allowedDraw = imi.allowedDraw;

		if (imi.serie) {
			this._serie = imi.serie;
		}
		this._playing = new JMatchPlay(this._serie?.result);
	}
	// addObserver(observer: IJObserver<any>): void {
	// 	this._observers.push(observer);
	// }
	// removeObserver(observer: IJObserver<any>): void {
	// 	throw new Error('Method not implemented.');
	// }
	// notify(): void {
	// 	throw new Error('Method not implemented.');
	// }

	get id(): string {
		return this._info.id;
	}
	get date(): JDateTime {return this._date}
	get homeTeam(): Team {
		return this._homeTeam;
	}
	get awayTeam(): Team {
		return this._awayTeam;
	}

	get state(): TypeMatchState {
		return this._state;
	}

	get serie(): JSerie | undefined {return this._serie}

	schedule(d: JDateTime): void {
		this._state =
			this._state == 'postponed' || this._state == 'scheduled'
				? 'reschuduled'
				: 'scheduled';
		this._date = d.copy();
	}

	// process
	start() {
		if (!(this._state === 'scheduled' || this._state === 'reschuduled')) throw new Error('Match is none scheduled')
		this._state = 'playing';
		this._playing.init(
			this._homeTeam.getTeamMatch(),
			this._awayTeam.getTeamMatch()
		);
	}

	advance() {
		if (this._state !== 'playing') throw new Error('Match is none playing');
		this._playing.advance();
		if (this._playing.time === 80 || this._playing.time === 100 || this._playing.time > 100) {
			if (!!this._serie && this._serie.matches[0].state === 'finished' && this._playing._globalResult?.getResultInfo().teamWinner === 'none') {
				this._playing.advance();
			} else if (this._playing.result?.getResultInfo().teamWinner === 'none' && !this._allowedDraw) {
				this._playing.advance();
			} else {
				this.finish();
			}
		}

	}

	finish(): void {
		this._state = 'finished';
		// this.notify();
	}

	get result(): IJResultInfo | undefined {
		return this._playing.result?.getResultInfo();
	}
}


