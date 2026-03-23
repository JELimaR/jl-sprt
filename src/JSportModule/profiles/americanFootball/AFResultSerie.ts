
import { A_ResultSerie, IA_ResultSerieInfo } from '../../Match/A_ResultSerie';
import AFResult from './AFResult';

/**
 * Resultado de una serie de American Football.
 * SerieScoreType: number (puntos acumulados en toda la serie).
 * Delega al AFResult que acumula los puntos de todos los matches.
 */
export default class AFResultSerie extends A_ResultSerie<number> {

  private _globalResult: AFResult;

  constructor(teamOneId: string, teamTwoId: string) {
    super(teamOneId, teamTwoId);
    this._globalResult = new AFResult(teamOneId, teamTwoId);
  }

  /** El A_Result que se pasa al MatchPlay para acumular puntos */
  get globalResult(): AFResult { return this._globalResult }

  getResultSerieInfo(): IA_ResultSerieInfo<number> {
    return this._globalResult.getResultInfo();
  }
}
