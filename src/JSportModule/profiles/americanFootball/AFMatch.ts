
import { A_Match } from '../../Match/A_Match';
import { TypeHalfWeekOfYear } from '../../../JCalendar/JDateTimeModule';
import Team from '../../data/Team';
import AFMatchPlay from './AFMatchPlay';
import AFResult from './AFResult';

/**
 * Partido de American Football.
 * Extiende A_Match con AFMatchPlay como simulación.
 * No permite empate (overtime lo resuelve).
 */
export default class AFMatch extends A_Match<number> {
  constructor(
    id: string,
    homeTeam: Team,
    awayTeam: Team,
    hw: TypeHalfWeekOfYear,
    season: number,
    allowedDraw: boolean,
    globalResult?: AFResult,
  ) {
    super(id, homeTeam, awayTeam, hw, season, allowedDraw, new AFMatchPlay(globalResult));
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
