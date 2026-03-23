
import { A_ResultSerie, IA_ResultSerieInfo } from '../../Match/A_ResultSerie';

/**
 * Resultado de una serie de volleyball.
 * SerieScoreType: number (puntos de partido acumulados).
 * 
 * Puntos de partido en volleyball:
 *   - Victoria 3-0 o 3-1: 3 puntos para el ganador, 0 para el perdedor
 *   - Victoria 3-2: 2 puntos para el ganador, 1 para el perdedor
 * 
 * Si tras los dos partidos hay empate en puntos de partido,
 * se juega un Golden Set (gestionado por VolleySerie).
 */
export default class VolleyResultSerie extends A_ResultSerie<number> {

  private _teamOnePoints: number = 0;
  private _teamTwoPoints: number = 0;

  constructor(teamOneId: string, teamTwoId: string) {
    super(teamOneId, teamTwoId);
  }

  /**
   * Agrega los puntos de partido de un match terminado.
   */
  addMatchPoints(teamId: string, points: number) {
    if (teamId === this._teamOneId) {
      this._teamOnePoints += points;
    } else if (teamId === this._teamTwoId) {
      this._teamTwoPoints += points;
    } else {
      throw new Error(`team ${teamId} no encontrado en VolleyResultSerie`);
    }
  }

  get teamOnePoints(): number { return this._teamOnePoints }
  get teamTwoPoints(): number { return this._teamTwoPoints }

  getResultSerieInfo(): IA_ResultSerieInfo<number> {
    const tw = this._teamOnePoints > this._teamTwoPoints ? this._teamOneId
      : this._teamTwoPoints > this._teamOnePoints ? this._teamTwoId : 'none';
    const tl = this._teamOnePoints < this._teamTwoPoints ? this._teamOneId
      : this._teamTwoPoints < this._teamOnePoints ? this._teamTwoId : 'none';
    return {
      teamOneScore: { team: this._teamOneId, score: this._teamOnePoints },
      teamTwoScore: { team: this._teamTwoId, score: this._teamTwoPoints },
      teamWinner: tw,
      teamLoser: tl,
    };
  }
}
