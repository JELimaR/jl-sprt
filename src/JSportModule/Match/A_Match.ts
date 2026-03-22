
import { IA_ResultInfo } from './A_Result';
import { JDateTime } from '../../JCalendar/JDateTimeModule';
import Team from '../data/Team';

// AClarar que significa cada estado
export type TypeMatchState =
	| 'created'
	| 'scheduled'
	| 'postponed'
	| 'reschuduled'
	| 'prev'
	| 'playing'
	| 'finished';

/**
 * Clase abstracta que define el contrato de un partido.
 * Cada deporte implementa su propia lógica de inicio, avance y finalización.
 * 
 * ScoreType: number para futbol/basketball, IVolleyScore para volleyball, etc.
 */
export abstract class A_Match<ScoreType> {

	protected _state: TypeMatchState = 'created';
	protected _homeTeam: Team;
	protected _awayTeam: Team;
	protected _date: JDateTime;
	protected _allowedDraw: boolean;

	constructor(homeTeam: Team, awayTeam: Team, date: JDateTime, allowedDraw: boolean) {
		this._homeTeam = homeTeam;
		this._awayTeam = awayTeam;
		this._date = date;
		this._allowedDraw = allowedDraw;
	}

	get homeTeam(): Team { return this._homeTeam; }
	get awayTeam(): Team { return this._awayTeam; }
	get date(): JDateTime { return this._date; }
	get state(): TypeMatchState { return this._state; }

	get isFinished(): boolean { return this._state === 'finished'; }

	schedule(d: JDateTime): void {
		this._state =
			this._state == 'postponed' || this._state == 'scheduled'
				? 'reschuduled'
				: 'scheduled';
		this._date = d.copy();
	}

	finish(): void {
		this._state = 'finished';
	}

	abstract get id(): string;
	abstract start(): void;
	abstract advance(): void;
	abstract get result(): IA_ResultInfo<ScoreType> | undefined;
}
