
import { A_Serie } from '../../Match/A_Serie';
import AFMatch from './AFMatch';
import AFResultSerie from './AFResultSerie';
import Team from '../../data/Team';
import { arr2, TypeBaseStageOption } from '../../data';
import { TypeHalfWeekOfYear } from '../../../JCalendar/JDateTimeModule';

/**
 * Serie de American Football.
 * MatchScoreType: number (puntos por match)
 * SerieScoreType: number (puntos acumulados en la serie)
 */
export default class AFSerie extends A_Serie<number, number> {

  constructor(
    id: string,
    teamOne: Team,
    teamTwo: Team,
    hws: arr2<TypeHalfWeekOfYear>,
    season: number,
    opt: TypeBaseStageOption,
  ) {
    const resultSerie = new AFResultSerie(teamOne.id, teamTwo.id);

    const matches: AFMatch[] = [
      new AFMatch(
        `${id}-M1`, teamOne, teamTwo, hws[0], season,
        opt === 'h&a', resultSerie.globalResult,
      )
    ];

    if (opt === 'h&a') {
      matches.push(
        new AFMatch(
          `${id}-M2`, teamTwo, teamOne, hws[1], season,
          true, resultSerie.globalResult,
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
    if (info.teamWinner === 'none') throw new Error(`no hubo ganador en la serie`);
    return (info.teamWinner === this._teamOne.id) ? this._teamOne : this._teamTwo;
  }

  get loser(): Team {
    return (this.winner.id === this._teamTwo.id) ? this._teamOne : this._teamTwo;
  }
}
