
import { A_Match } from '../../Match/A_Match';
import { TypeHalfWeekOfYear } from '../../../JCalendar/JDateTimeModule';
import Team from '../../data/Team';
import FootballMatchPlay from './FootballMatchPlay';
import FootballResult from './FootballResult';

/**
 * Partido de fútbol.
 * Extiende A_Match con FootballMatchPlay como simulación.
 * Lógica de advance: 80 min normales, tiempo extra si no se permite empate
 * o si en serie ida/vuelta el resultado global es empate.
 */
export default class FootballMatch extends A_Match<number> {
  constructor(
    id: string,
    homeTeam: Team,
    awayTeam: Team,
    hw: TypeHalfWeekOfYear,
    season: number,
    allowedDraw: boolean,
    globalResult?: FootballResult,
  ) {
    super(id, homeTeam, awayTeam, hw, season, allowedDraw, new FootballMatchPlay(globalResult));
  }

  advance() {
    if (this._state !== 'playing') throw new Error('Match is none playing');
    this._playing.advance();
    if (this._playing.time === 80 || this._playing.time === 100 || this._playing.time > 100) {
      if (this._serieResult && this._serieFirstMatchState
        && this._serieFirstMatchState() === 'finished'
        && this._playing.globalResult?.getResultInfo().teamWinner === 'none') {
        this._playing.advance();
      } else if (this._playing.result?.getResultInfo().teamWinner === 'none' && !this._allowedDraw) {
        this._playing.advance();
      } else {
        this.finish();
      }
    }
  }
}
