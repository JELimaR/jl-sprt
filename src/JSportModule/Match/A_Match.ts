
import { IA_ResultInfo } from './A_Result';
import { A_ResultSerie } from './A_ResultSerie';
import { A_MatchPlay } from './A_MatchPlay';
import { JDateTime, TypeHalfWeekOfYear } from '../../JCalendar/JDateTimeModule';
import Team from '../data/Team';

export type TypeMatchState =
	| 'created'
	| 'scheduled'
	| 'postponed'
	| 'reschuduled'
	| 'prev'
	| 'playing'
	| 'finished';

/**
 * Clase abstracta que representa un partido genérico.
 * La lógica de start/advance/finish es común a todos los deportes.
 * Cada deporte extiende esta clase y provee su propio A_MatchPlay.
 */
export abstract class A_Match<ScoreType> {

	protected _state: TypeMatchState = 'created';
	protected _id: string;
	protected _homeTeam: Team;
	protected _awayTeam: Team;
	protected _date: JDateTime;
	protected _allowedDraw: boolean;
	protected _playing: A_MatchPlay<ScoreType>;
	protected _serieResult?: A_ResultSerie<unknown>;
	protected _serieFirstMatchState?: () => TypeMatchState;

	constructor(
		id: string,
		homeTeam: Team,
		awayTeam: Team,
		hw: TypeHalfWeekOfYear,
		season: number,
		allowedDraw: boolean,
		playing: A_MatchPlay<ScoreType>,
	) {
		this._id = id;
		this._homeTeam = homeTeam;
		this._awayTeam = awayTeam;
		this._date = JDateTime.createFromHalfWeekOfYearAndYear(hw, season, 'middle');
		this._allowedDraw = allowedDraw;
		this._playing = playing;

		this._homeTeam.addNewMatch(this);
		this._awayTeam.addNewMatch(this);
	}

	get id(): string { return this._id }
	get homeTeam(): Team { return this._homeTeam; }
	get awayTeam(): Team { return this._awayTeam; }
	get date(): JDateTime { return this._date; }
	get state(): TypeMatchState { return this._state; }
	get isFinished(): boolean { return this._state === 'finished'; }

	get result(): IA_ResultInfo<ScoreType> | undefined {
		return this._playing.result?.getResultInfo();
	}

	/**
	 * Configura la referencia a la serie (resultado de serie y estado del primer match).
	 * Llamado por la serie concreta al crear los matches.
	 */
	setSerieContext(serieResult: A_ResultSerie<unknown>, firstMatchState: () => TypeMatchState) {
		this._serieResult = serieResult;
		this._serieFirstMatchState = firstMatchState;
	}

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

	start() {
		if (!(this._state === 'scheduled' || this._state === 'reschuduled'))
			throw new Error('Match is none scheduled');
		this._state = 'playing';
		this._playing.init(
			this._homeTeam.getTeamMatch(),
			this._awayTeam.getTeamMatch()
		);
	}

	abstract advance(): void;
}
