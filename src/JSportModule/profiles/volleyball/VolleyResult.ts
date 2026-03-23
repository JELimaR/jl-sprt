
import { A_Result, IA_ResultInfo, TypeTotalScore } from '../../Match/A_Result';
import { IVolleyScore } from './VolleyScore';

/**
 * Resultado de un partido de volleyball.
 * Score: IVolleyScore (sets ganados + puntos por set).
 * Gana el equipo que llega primero a 3 sets.
 */
export default class VolleyResult extends A_Result<IVolleyScore> {

  private _teamOneScore: TypeTotalScore<IVolleyScore>;
  private _teamTwoScore: TypeTotalScore<IVolleyScore>;

  constructor(teamOneId: string, teamTwoId: string) {
    super(teamOneId, teamTwoId);
    this._teamOneScore = { team: teamOneId, score: { setsWon: 0, setPoints: [] } };
    this._teamTwoScore = { team: teamTwoId, score: { setsWon: 0, setPoints: [] } };
  }

  /**
   * Agrega el resultado de un set.
   * @param teamId equipo que ganó el set
   * @param winnerPoints puntos del ganador en el set
   * @param loserPoints puntos del perdedor en el set
   */
  addSetResult(teamId: string, winnerPoints: number, loserPoints: number) {
    if (teamId === this._teamOneScore.team) {
      this._teamOneScore.score.setsWon++;
      this._teamOneScore.score.setPoints.push(winnerPoints);
      this._teamTwoScore.score.setPoints.push(loserPoints);
    } else if (teamId === this._teamTwoScore.team) {
      this._teamTwoScore.score.setsWon++;
      this._teamTwoScore.score.setPoints.push(winnerPoints);
      this._teamOneScore.score.setPoints.push(loserPoints);
    } else {
      throw new Error(`en addSetResult: team ${teamId} no encontrado`);
    }
  }

  getScore(teamId: string): IVolleyScore {
    if (teamId === this._teamOneScore.team) return this._teamOneScore.score;
    if (teamId === this._teamTwoScore.team) return this._teamTwoScore.score;
    throw new Error(`en getScore: team ${teamId} no encontrado`);
  }

  getResultInfo(): IA_ResultInfo<IVolleyScore> {
    const s1 = this._teamOneScore.score.setsWon;
    const s2 = this._teamTwoScore.score.setsWon;
    const tw = s1 > s2 ? this._teamOneScore.team
      : s2 > s1 ? this._teamTwoScore.team : 'none';
    const tl = s1 < s2 ? this._teamOneScore.team
      : s2 < s1 ? this._teamTwoScore.team : 'none';
    return {
      teamOneScore: this._teamOneScore,
      teamTwoScore: this._teamTwoScore,
      teamWinner: tw,
      teamLoser: tl,
    };
  }
}
