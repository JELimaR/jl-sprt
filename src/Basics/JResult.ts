import { arr2 } from './types'

interface IJScore {
  team: string;
  score: number;
}

export interface IJResultInfo {
	teamOneScore: IJScore;
	teamTwoScore: IJScore;
	winner: 'L' | 'V' | 'E';
  teamWinner: string | 'none';
  teamLoser: string | 'none';
}

export default class JResult {
	_teamOneScore: IJScore;
	_teamTwoScore: IJScore;

	constructor(teams: arr2<string>) {
    this._teamOneScore = {
      team: teams[0],
      score: 0
    };
    this._teamTwoScore = {
      team: teams[1],
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

	getResultInfo(): IJResultInfo {
		const w = (this._teamOneScore.score > this._teamTwoScore.score) ? 'L' : ((this._teamOneScore.score < this._teamTwoScore.score) ? 'V' : 'E')
    const tw = (this._teamOneScore.score > this._teamTwoScore.score) ? this._teamOneScore.team : ((this._teamOneScore.score < this._teamTwoScore.score) ? this._teamTwoScore.team : 'none');
    const tl = (this._teamOneScore.score < this._teamTwoScore.score) ? this._teamOneScore.team : ((this._teamOneScore.score > this._teamTwoScore.score) ? this._teamTwoScore.team : 'none');
		return {
			teamOneScore: this._teamOneScore,
			teamTwoScore: this._teamTwoScore,
			winner: w,
      teamWinner: tw,
      teamLoser: tl,
		}
	}
}