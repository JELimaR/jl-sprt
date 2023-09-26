import BaseStage, { IBaseStageConfig } from '../../BaseStage';
import JCalendar from '../../../../JCalendar/JCalendar';
import Team from '../../../Team';
import { JRound } from './JRound';
import JSerie from '../../../Match/JSerie';
import Event_RoundCreationAndTeamsDraw from './Event_RoundCreationAndTeamsDraw';
import Match from '../../../Match/JMatch';
import { arr2, IElementInfo } from '../../../types';
import TeamTableItem from '../../../Rank/TeamTableItem';
import { simpleSortFunc, TypeTableMatchState } from '../../../Rank/ranking';
import { TypeHalfWeekOfYear, JDateTime } from '../../../../JCalendar/JDateTimeModule';


export interface ISingleElminationConfig extends IBaseStageConfig {
  roundsNumber: number;
  roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

// export interface IElementInfo extends IBaseStageInfo { }

export default class SingleElmination extends BaseStage<IElementInfo, ISingleElminationConfig> { // Single elimination

  private _rounds: JRound[] = [];

  constructor(info: IElementInfo, config: ISingleElminationConfig) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config);
  }

  constructorVerification(config: ISingleElminationConfig): void {
    if (SingleElmination.maxNumberRound(config.participantsNumber) < config.roundsNumber) {
      throw new Error(`la cantidad de rounds: ${config.roundsNumber} es
      mayor a la cantidad posible de rounds: ${SingleElmination.maxNumberRound(config.participantsNumber)} para la cantidad de
      participants: ${config.participantsNumber}`)
    }

  }

  get rounds(): JRound[] { return this._rounds }
  get matches(): Match[] {
    let out: Match[] = [];
    this._rounds.forEach((r: JRound) => {
      r.matches.forEach((m: Match) => out.push(m));
    })
    return out;
  }

  /**
   * Para crear los rounds.
   * Se agregan al calendario eventos para la creacion y "asignacion" de teams de todas las rounds.
   * @param cal JCalendar
   */
  createChildren(cal: JCalendar): void {

    for (let i = 0; i < this.config.roundsNumber; i++) {
      cal.addEvent(new Event_RoundCreationAndTeamsDraw({ // crear los eventos de draw y round creation
        dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this.config.roundHalfWeeksSchedule[i], this.info.season, 'start', 12).getIJDateTimeCreator(),
        calendar: cal,
        playoff: this,
      }))
    }
  }

  createNewRound(teamsDrawSorted: Team[], calendar: JCalendar) {
    const roundNumber: number = this._rounds.length + 1;
    const roundIndex: number = this._rounds.length;
    const round: JRound = new JRound({
      num: roundNumber,
      series: this.createRoundSeries(teamsDrawSorted!),
      halfweeks: this.config.roundHalfWeeks[roundIndex],
      halfweekSchedule: this.config.roundHalfWeeksSchedule[roundIndex],
    })

    round.generateMatchOfRoundScheduleEvents(calendar, this);
    this._rounds.push(round);
  }

  createRoundSeries(teams: Team[]): JSerie[] {
    let out: JSerie[] = [];

    const total: number = this.matches.length / ((this.config.opt == 'h&a') ? 2 : 1);
    for (let i = 0; i < teams.length; i += 2) {
      out.push(
        new JSerie({
          teamOne: teams[i + 0],
          teamTwo: teams[i + 1],
          id: `${this.info.id}-S${total + i / 2 + 1}`,
          season: this.info.season,
          hws: this.config.roundHalfWeeks[this._rounds.length],
          opt: this.config.opt
        })
      )
    }

    return out;
  }

  getTable(ttms: TypeTableMatchState): TeamTableItem[] {
    let out: TeamTableItem[] = this.calcTableValues(ttms);

    this.rounds.forEach((r: JRound, idx: number) => {
      r.losers.forEach((loser: Team) => {
        let item = out.find((value: TeamTableItem) => value.team.id === loser.id)
        if (item) item.pos = this.rounds.length + 1 - idx;
      })
    });

    out.sort((a, b) => simpleSortFunc(a, b, true));

    return out;
  }

  /************************************************************************************************************************************************************* */
  // statics 
  static maxNumberRound(partsNumber: number): number {
    let out: number = 0;
    while ((partsNumber % 2) === 0) {
      out++;
      partsNumber /= 2;
    }
    return out;
  }

  static winnersInMaxNumberRound(partsNumber: number): number {
    while ((partsNumber % 2) === 0) {
      partsNumber /= 2;
    }
    return partsNumber;
  }

  //
  static teamsSortForDraw(teamRankArr: Team[]): Team[] {
    let out: Team[] = [];
    const total = teamRankArr.length;
    if (total % 2 !== 0)
      throw new Error(`En un playoff (single elimination), debe ser par la cantidad de teams. (En SingleElimination.teamsSortForDraw)`)
    for (let i = 0; i < total / 2; i++) {
      out.push(
        teamRankArr[total - i - 1], teamRankArr[i]
      )

    }
    return out;
  }
}