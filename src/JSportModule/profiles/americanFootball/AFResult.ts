
import { A_Result, IA_ResultInfo, TypeTotalScore } from '../../Match/A_Result';

/**
 * Resultado de un partido de American Football.
 * Score: number (puntos: touchdowns 6, field goals 3, safeties 2, extra points 1-2).
 */
export default class AFResult extends A_Result<number> {
  _teamOneScore: TypeTotalScore<number>;
  _teamTwoScore: TypeTotalScore<number>;

  constructor(one: string, two: string) {
    super(one, two);
    this._teamOneScore = { team: one, score: 0 };
    this._teamTwoScore = { team: two, score: 0 };
  }

  addScore(id: string) {
    if (id === this._teamOneScore.team) {
      this._teamOneScore.score++;
    } else if (id === this._teamTwoScore.team) {
      this._teamTwoScore.score++;
    } else {
      throw new Error(`en add score`)
    }
  }

  getScore(id: string): number {
    if (id === this._teamOneScore.team) return this._teamOneScore.score;
    if (id === this._teamTwoScore.team) return this._teamTwoScore.score;
    throw new Error(`en get score`);
  }

  getResultInfo(): IA_ResultInfo<number> {
    const tw = (this._teamOneScore.score > this._teamTwoScore.score)
      ? this._teamOneScore.team
      : ((this._teamOneScore.score < this._teamTwoScore.score)
        ? this._teamTwoScore.team : 'none');
    const tl = (this._teamOneScore.score < this._teamTwoScore.score)
      ? this._teamOneScore.team
      : ((this._teamOneScore.score > this._teamTwoScore.score)
        ? this._teamTwoScore.team : 'none');
    return {
      teamOneScore: this._teamOneScore,
      teamTwoScore: this._teamTwoScore,
      teamWinner: tw,
      teamLoser: tl,
    }
  }
}
