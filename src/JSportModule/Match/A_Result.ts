
export type TypeTotalScore<ScoreType> = {
  team: string;
  score: ScoreType;
}

export interface IA_ResultInfo<ScoreType> {
  teamOneScore: TypeTotalScore<ScoreType>;
  teamTwoScore: TypeTotalScore<ScoreType>;
  teamWinner: string | 'none';
  teamLoser: string | 'none';
}

/**
 * Clase abstracta que define el contrato de un resultado de partido.
 * Cada deporte debe implementar su propia lógica de score y determinación de ganador.
 * 
 * ScoreType: number para futbol/basketball, IVolleyScore para volleyball, etc.
 */
export abstract class A_Result<ScoreType> {

  protected _teamOneId: string;
  protected _teamTwoId: string;

  constructor(teamOneId: string, teamTwoId: string) {
    this._teamOneId = teamOneId;
    this._teamTwoId = teamTwoId;
  }

  get teamOneId(): string { return this._teamOneId }
  get teamTwoId(): string { return this._teamTwoId }

  abstract addScore(teamId: string, ...args: any[]): void;
  abstract getScore(teamId: string): ScoreType;
  abstract getResultInfo(): IA_ResultInfo<ScoreType>;
}
