type TypeTotalScore = {
  team: string;
  score: number;
}

export interface IJResultSerieInfo {
	teamOneScore: TypeTotalScore;
	teamTwoScore: TypeTotalScore;
  teamWinner: string;
  teamLoser: string;
}

export default class JResultSerie {

  get teamWinner(): string {
    return '';
  }

  get teamLoser(): string {
    return '';
  }
  
}