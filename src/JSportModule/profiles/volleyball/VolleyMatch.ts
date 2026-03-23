
import { A_Match } from '../../Match/A_Match';
import { TypeHalfWeekOfYear } from '../../../JCalendar/JDateTimeModule';
import Team from '../../data/Team';
import VolleyMatchPlay from './VolleyMatchPlay';
import VolleyResult from './VolleyResult';
import VolleyResultSerie from './VolleyResultSerie';
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

  /**
   * Al terminar un match de volleyball, se calculan los puntos de partido
   * y se agregan al VolleyResultSerie (si existe contexto de serie).
   * 
   * Puntos de partido:
   *   - Victoria 3-0 o 3-1: 3 puntos ganador, 0 perdedor
   *   - Victoria 3-2: 2 puntos ganador, 1 perdedor
   */
  finish(): void {
    super.finish();

    if (this._serieResult && this._serieResult instanceof VolleyResultSerie) {
      const res = this._playing.result?.getResultInfo();
      if (res && res.teamWinner !== 'none') {
        const winnerSets = Math.max(res.teamOneScore.score.setsWon, res.teamTwoScore.score.setsWon);
        const loserSets = Math.min(res.teamOneScore.score.setsWon, res.teamTwoScore.score.setsWon);
        const loserId = res.teamLoser;

        if (loserSets === 2) {
          // 3-2: ganador 2 pts, perdedor 1 pt
          this._serieResult.addMatchPoints(res.teamWinner, 2);
          this._serieResult.addMatchPoints(loserId, 1);
        } else {
          // 3-0 o 3-1: ganador 3 pts, perdedor 0 pts
          this._serieResult.addMatchPoints(res.teamWinner, 3);
          this._serieResult.addMatchPoints(loserId, 0);
        }
      }
    }
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
