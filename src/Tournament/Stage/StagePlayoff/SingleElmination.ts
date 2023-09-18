import { TypeHalfWeekOfYear } from '../../../Calendar/DateTime/types';
import JCalendar from '../../../Calendar/JCalendar';
import Team from '../../Team';
import { JRound } from './Round/JRound';
import JSerie from '../../Match/JSerie';
import { JDateTime } from '../../../Calendar/DateTime/JDateTime';
import Event_RoundCreationAndTeamsDraw from './Round/Event_RoundCreationAndTeamsDraw';
import JMatch from '../../Match/JMatch';
import { arr2 } from '../../types';
import BaseStage, { IBaseStageConfig, IBaseStageInfo } from '../BaseStage';


export interface ISingleElminationConfig extends IBaseStageConfig {
  roundsNumber: number;
  roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

export interface ISingleElminationInfo extends IBaseStageInfo { }

export default class SingleElmination extends BaseStage<ISingleElminationInfo, ISingleElminationConfig> { // Single elimination

  private _rounds: JRound[] = [];

  constructor(info: ISingleElminationInfo, config: ISingleElminationConfig) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
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
  get matches(): JMatch[] {
    let out: JMatch[] = [];
    this._rounds.forEach((r: JRound) => {
      r.matches.forEach((m: JMatch) => out.push(m));
    })
    return out;
  }

  /**
   * Para crear los rounds.
   * Se agregan al calendario eventos para la creacion y "asignacion" de teams de todas las rounds.
   * @param cal JCalendar
   */
  createChildren(cal: JCalendar): void {

    // cal.addEvent(new Event_RoundCreationAndTeamsDraw({ // crear el evento de draw y round creation
    //   dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this.config.roundHalfWeeksSchedule[0], this.info.season, 'start', 12).getIJDateTimeCreator(),
    //   calendar: cal,
    //   playoff: this,
    //   // teams: this.teamsArr
    // }))

    for (let i = 0; i < this.config.roundsNumber; i++) {
      cal.addEvent(new Event_RoundCreationAndTeamsDraw({ // crear los eventos de draw y round creation
        dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this.config.roundHalfWeeksSchedule[i], this.info.season, 'start', 12).getIJDateTimeCreator(),
        calendar: cal,
        playoff: this,
        // teams,
      }))
    }
  }

  createNewRound(teamsDrawSorted: Team[], calendar: JCalendar/*, dt: JDateTime*/) {
    const roundNumber: number = this._rounds.length + 1;
    const roundIndex: number = this._rounds.length;
    const round: JRound = new JRound({
      num: roundNumber,
      series: this.createRoundSeries(teamsDrawSorted!),
      halfweeks: this.config.roundHalfWeeks[roundIndex],
      halfweekSchedule: this.config.roundHalfWeeksSchedule[roundIndex],
    })

    round.generateMatchOfRoundScheduleEvents(calendar, this/*, dt*/);
    this._rounds.push(round);
  }

  createRoundSeries(teams: Team[]): JSerie[] {
    // console.log('presentados para generar serie', teams.length);
    let out: JSerie[] = [];

    const total: number = this.matches.length / ((this.config.opt == 'h&a') ? 2 : 1);
    for (let i = 0; i < teams.length; i += 2) {
      out.push(
        new JSerie({
          teamOne: teams[i + 0],
          teamTwo: teams[i + 1],
          id: `${this.info.id}-S${total + i / 2 + 1}`,
          // isIV: this.config.isIV,
          season: this.info.season,
          hws: this.config.roundHalfWeeks[this._rounds.length],
          // isNeutral: this.config.isNeutral,
          opt: this.config.opt
        })
      )
    }

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
    const total = teamRankArr.length; // debe ser par
    for (let i = 0; i < total / 2; i++) {
      out.push(
        teamRankArr[total - i - 1], teamRankArr[i]
      )

    }
    return out;
  }
}