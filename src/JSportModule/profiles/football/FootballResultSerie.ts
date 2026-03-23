
import { A_ResultSerie, IA_ResultSerieInfo } from '../../Match/A_ResultSerie';
import FootballResult from './FootballResult';

/**
 * Resultado de una serie de fútbol.
 * SerieScoreType: number (goles acumulados en toda la serie).
 * Delega al FootballResult que acumula los goles de todos los matches.
 */
export default class FootballResultSerie extends A_ResultSerie<number> {

  private _globalResult: FootballResult;

  constructor(teamOneId: string, teamTwoId: string) {
    super(teamOneId, teamTwoId);
    this._globalResult = new FootballResult(teamOneId, teamTwoId);
  }

  /** El A_Result que se pasa al MatchPlay para acumular goles */
  get globalResult(): FootballResult { return this._globalResult }

  getResultSerieInfo(): IA_ResultSerieInfo<number> {
    return this._globalResult.getResultInfo();
  }
}
