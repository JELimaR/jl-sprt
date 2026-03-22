
import JSerie from './Serie';
import ScoreMatchPlay from './ScoreMatchPlay';
import { A_Match } from './A_Match';
import { IA_ResultInfo } from './A_Result';
import { TypeHalfWeekOfYear, JDateTime } from '../../JCalendar/JDateTimeModule';
import Team from '../data/Team';

export interface IScoreMatchInfo {
	id: string;
	hw: TypeHalfWeekOfYear;
	season: number;
	homeTeam: Team;
	awayTeam: Team;
	serie?: JSerie;
	result?: IA_ResultInfo<number>;
	allowedDraw: boolean;
	isNeutral: boolean;
}

/**
 * Partido basado en score numérico (goles, puntos, etc.).
 * Aplica para deportes donde el score es un número simple: fútbol, basketball, handball, etc.
 */
export default class ScoreMatch extends A_Match<number> {

	private _info: IScoreMatchInfo;
	private _playing: ScoreMatchPlay;
	private _serie?: JSerie;

	constructor(imi: IScoreMatchInfo) {
		super(
			imi.homeTeam,
			imi.awayTeam,
			JDateTime.createFromHalfWeekOfYearAndYear(imi.hw, imi.season, 'middle'),
			imi.allowedDraw,
		);
		this._info = { ...imi };

		this._homeTeam.addNewMatch(this);
		this._awayTeam.addNewMatch(this);

		if (imi.serie) {
			this._serie = imi.serie;
		}
		this._playing = new ScoreMatchPlay(this._serie?.result);
	}

	get id(): string {
		return this._info.id;
	}

	get serie(): JSerie | undefined { return this._serie }

	start() {
		if (!(this._state === 'scheduled' || this._state === 'reschuduled')) throw new Error('Match is none scheduled')
		this._state = 'playing';
		this._playing.init(
			this._homeTeam.getTeamMatch(),
			this._awayTeam.getTeamMatch()
		);
		this._info.result = this._playing.result?.getResultInfo()
	}

	advance() {
		if (this._state !== 'playing') throw new Error('Match is none playing');
		this._playing.advance();
		if (this._playing.time === 80 || this._playing.time === 100 || this._playing.time > 100) {
			if (!!this._serie && this._serie.matches[0].state === 'finished' && this._playing.globalResult?.getResultInfo().teamWinner === 'none') {
				this._playing.advance();
			} else if (this._playing.result?.getResultInfo().teamWinner === 'none' && !this._allowedDraw) {
				this._playing.advance();
			} else {
				this.finish();
			}
		}
	}

	get result(): IA_ResultInfo<number> | undefined {
		return this._playing.result?.getResultInfo();
	}
}
