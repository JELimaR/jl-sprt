
export interface IA_ResultSerieInfo<SerieScoreType> {
  teamOneScore: { team: string; score: SerieScoreType };
  teamTwoScore: { team: string; score: SerieScoreType };
  teamWinner: string | 'none';
  teamLoser: string | 'none';
}

/**
 * Clase abstracta que define el contrato del resultado de una serie.
 * 
 * SerieScoreType: el tipo de score de la serie, que no necesariamente
 * coincide con el ScoreType del match individual.
 * Ej: en volleyball, el match score es IVolleyScore (sets + puntos por set),
 * pero el serie score podría ser number (puntos de partido: 3 por 3-0, 2 por 3-1, etc.).
 */
export abstract class A_ResultSerie<SerieScoreType> {

  protected _teamOneId: string;
  protected _teamTwoId: string;

  constructor(teamOneId: string, teamTwoId: string) {
    this._teamOneId = teamOneId;
    this._teamTwoId = teamTwoId;
  }

  get teamOneId(): string { return this._teamOneId }
  get teamTwoId(): string { return this._teamTwoId }

  abstract getResultSerieInfo(): IA_ResultSerieInfo<SerieScoreType>;
}
