
import { A_Match } from '../../Match/A_Match';
import { TypeHalfWeekOfYear } from '../../../JCalendar/JDateTimeModule';
import Team from '../../data/Team';
import VolleyMatchPlay from './VolleyMatchPlay';
import VolleyResult from './VolleyResult';
import { IVolleyScore } from './VolleyScore';

/**
 * Partido de volleyball.
 * Extiende A_Match con VolleyMatchPlay como simulación.
 * Lógica de advance: se juegan rallies hasta que un equipo gane 3 sets.
 * No hay concepto de "tiempo" como en fútbol — el partido termina cuando
 * se completan los sets necesarios.
 */
export default class VolleyMatch extends A_Match<IVolleyScore> {
  constructor(
    id: string,
    homeTeam: Team,
    awayTeam: Team,
    hw: TypeHalfWeekOfYear,
    season: number,
    allowedDraw: boolean,
    globalResult?: VolleyResult,
  ) {
    super(id, homeTeam, awayTeam, hw, season, allowedDraw, new VolleyMatchPlay(globalResult));
  }

  advance() {
    if (this._state !== 'playing') throw new Error('Match is none playing');
    this._playing.advance();

    // Verificar si el partido terminó (alguien ganó 3 sets)
    const res = this._playing.result?.getResultInfo();
    if (res) {
      const s1 = res.teamOneScore.score.setsWon;
      const s2 = res.teamTwoScore.score.setsWon;
      if (s1 >= 3 || s2 >= 3) {
        this.finish();
      }
    }
  }
}
