
import { A_Result, IJResultInfo, TypeTotalScore } from './A_Result';

// re-export para no romper imports existentes
export { IJResultInfo, TypeTotalScore } from './A_Result';

// no se usa pero depende de res y punt
export type TypeTeamResultInfo = {
  id: string;
  GF: number;
  GA: number;
  res: 'W' | 'D' | 'L';
}

/**
 * Resultado de un partido de fútbol (goles).
 * Implementación concreta de A_Result.
 */
export default class JResult extends A_Result {
  _teamOneScore: TypeTotalScore;
  _teamTwoScore: TypeTotalScore;

  constructor(one: string, two: string) {
    super(one, two);
    this._teamOneScore = {
      team: one,
      score: 0
    };
    this._teamTwoScore = {
      team: two,
      score: 0
    };
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
    if (id === this._teamOneScore.team) {
      return this._teamOneScore.score;
    } else if (id === this._teamTwoScore.team) {
      return this._teamTwoScore.score;
    } else {
      throw new Error(`en get score`)
    }
  }

  getTeamResultInfo(id: string) {
    const tw = (this._teamOneScore.score > this._teamTwoScore.score)
      ? this._teamOneScore.team
      :
      (this._teamOneScore.score < this._teamTwoScore.score)
        ? this._teamTwoScore.team
        : 'none';
    const res: string = (tw === 'none') ? 'D' : (tw === id) ? 'W' : 'L'
    if (id === this._teamOneScore.team) {
      return {
        gf: this._teamOneScore.score,
        ge: this._teamTwoScore.score,
        res
      };
    } else if (id === this._teamTwoScore.team) {
      return this._teamTwoScore.score;
    } else {
      throw new Error(`en getTeamResultInfo`)
    }
  }

  get teamWinner(): string {
    return '';
  }

  get teamLoser(): string {
    return '';
  }

  getResultInfo(): IJResultInfo {
    const tw = (this._teamOneScore.score > this._teamTwoScore.score) ? this._teamOneScore.team : ((this._teamOneScore.score < this._teamTwoScore.score) ? this._teamTwoScore.team : 'none');
    const tl = (this._teamOneScore.score < this._teamTwoScore.score) ? this._teamOneScore.team : ((this._teamOneScore.score > this._teamTwoScore.score) ? this._teamTwoScore.team : 'none');
    return {
      teamOneScore: this._teamOneScore,
      teamTwoScore: this._teamTwoScore,
      teamWinner: tw,
      teamLoser: tl,
    }
  }
}
