
import { A_Serie } from '../../Match/A_Serie';
import FootballMatch from './FootballMatch';
import FootballResultSerie from './FootballResultSerie';
import Team from '../../data/Team';
import { arr2, TypeBaseStageOption } from '../../data';
import { TypeHalfWeekOfYear } from '../../../JCalendar/JDateTimeModule';

/**
 * Serie de fútbol (ida y vuelta o partido único).
 * MatchScoreType: number (goles por match)
 * SerieScoreType: number (goles acumulados en la serie)
 */
export default class FootballSerie extends A_Serie<number, number> {

  constructor(
    id: string,
    teamOne: Team,
    teamTwo: Team,
    hws: arr2<TypeHalfWeekOfYear>,
    season: number,
    opt: TypeBaseStageOption,
  ) {
    const resultSerie = new FootballResultSerie(teamOne.id, teamTwo.id);

    const matches: FootballMatch[] = [
      new FootballMatch(
        `${id}-M1`, teamOne, teamTwo, hws[0], season,
        opt === 'h&a', resultSerie.globalResult,
      )
    ];

    if (opt === 'h&a') {
      matches.push(
        new FootballMatch(
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
