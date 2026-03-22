
export type TypeTotalScore = {
  team: string;
  score: number;
}

export interface IJResultInfo {
  teamOneScore: TypeTotalScore;
  teamTwoScore: TypeTotalScore;
  teamWinner: string | 'none';
  teamLoser: string | 'none';
}

/**
 * Clase abstracta que define el contrato de un resultado de partido.
 * Cada deporte debe implementar su propia lógica de score y determinación de ganador.
 */
export abstract class A_Result {

  protected _teamOneId: string;
  protected _teamTwoId: string;

  constructor(teamOneId: string, teamTwoId: string) {
    this._teamOneId = teamOneId;
    this._teamTwoId = teamTwoId;
  }

  get teamOneId(): string { return this._teamOneId }
  get teamTwoId(): string { return this._teamTwoId }

  abstract addScore(teamId: string, ...args: any[]): void;
  abstract getScore(teamId: string): number;
  abstract getResultInfo(): IJResultInfo;
}
