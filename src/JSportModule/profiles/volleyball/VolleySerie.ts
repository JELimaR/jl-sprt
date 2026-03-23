
import { A_Serie } from '../../Match/A_Serie';
import VolleyMatch from './VolleyMatch';
import VolleyResultSerie from './VolleyResultSerie';
import { IVolleyScore } from './VolleyScore';
import Team from '../../data/Team';
import { arr2, TypeBaseStageOption } from '../../data';
import { TypeHalfWeekOfYear } from '../../../JCalendar/JDateTimeModule';

/**
 * Serie de volleyball.
 * MatchScoreType: IVolleyScore (sets + puntos por set)
 * SerieScoreType: number (puntos de partido acumulados)
 * 
 * Se juegan dos partidos. Puntos de partido:
 *   - Victoria 3-0 o 3-1: 3 puntos ganador, 0 perdedor
 *   - Victoria 3-2: 2 puntos ganador, 1 perdedor
 * 
 * Si hay empate en puntos de partido tras ambos matches,
 * se juega un Golden Set (set único a 15 puntos, diferencia mínima de 2).
 * 
 * TODO: Implementar lógica de Golden Set cuando se necesite.
 */
export default class VolleySerie extends A_Serie<IVolleyScore, number> {

  constructor(
    id: string,
    teamOne: Team,
    teamTwo: Team,
    hws: arr2<TypeHalfWeekOfYear>,
    season: number,
    opt: TypeBaseStageOption,
  ) {
    const resultSerie = new VolleyResultSerie(teamOne.id, teamTwo.id);

    const matches: VolleyMatch[] = [
      new VolleyMatch(
        `${id}-M1`, teamOne, teamTwo, hws[0], season,
        opt === 'h&a', // en volleyball no hay empate, pero allowedDraw controla overtime
      )
    ];

    if (opt === 'h&a') {
      matches.push(
        new VolleyMatch(
          `${id}-M2`, teamTwo, teamOne, hws[1], season,
          true,
        )
      );
    }

    super(id, teamOne, teamTwo, opt, resultSerie, matches);

    for (const m of this._matches) {
      m.setSerieContext(this._resultSerie, () => this._matches[0].state);
    }
  }

  get isFinished(): boolean {
    return this._matches.every((m) => m.state === 'finished');
  }

  get winner(): Team {
    const info = this._resultSerie.getResultSerieInfo();
    if (info.teamWinner === 'none') throw new Error('no hubo ganador en la serie de volleyball');
    return (info.teamWinner === this._teamOne.id) ? this._teamOne : this._teamTwo;
  }

  get loser(): Team {
    return (this.winner.id === this._teamTwo.id) ? this._teamOne : this._teamTwo;
  }
}
