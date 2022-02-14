import { TypeHalfWeekOfYear } from '../../../Calendar/DateTime/types';
import JCalendar from '../../../Calendar/JCalendar';
import JTeam from '../../JTeam';
import { JRound } from './Round/JRound';
import JSerie from '../../Match/JSerie';
import { JDateTime } from '../../../Calendar/DateTime/JDateTime';
import JEventRoundCreationAndTeamsDraw from './Round/JEventRoundCreationAndTeamsDraw';
import JMatch from '../../Match/JMatch';
import { arr2 } from '../../types';
import { IJTeamTableItem } from '../../Rank/JTeamTableItem';
import { JRankCalculator } from '../../Rank/JRank';
import JBase, { IJBaseConfig } from '../JBase';


export interface IJSingleElminationConfig extends IJBaseConfig {
  roundsNumber: number;
  roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

export default class JSingleElmination extends JBase { // Single elimination
  _roundsNumber: number;
  _roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  _roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
  _rounds: JRound[] = [];
  _teams: JTeam[] = [];

  constructor(icc: IJSingleElminationConfig) {
    super(icc)
    if (JSingleElmination.maxNumberRound(icc.participantsNumber) < icc.roundsNumber) {
      throw new Error(`la cantidad de rounds: ${icc.roundsNumber} es
      mayor a la cantidad posible de rounds: ${JSingleElmination.maxNumberRound(icc.participantsNumber)} para la cantidad de
      participants: ${icc.participantsNumber}`)
    }
    this._roundsNumber = icc.roundsNumber
    this._roundHalfWeeks = icc.roundHalfWeeks
    this._roundHalfWeeksSchedule = icc.roundHalfWeeksSchedule
  }

  get config(): IJSingleElminationConfig {
    return {
      ...super.config,
      roundsNumber: this._roundsNumber,
      roundHalfWeeks: this._roundHalfWeeks,
      roundHalfWeeksSchedule: this._roundHalfWeeksSchedule
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
  get teams(): JTeam[] { return this._teams }

  get table(): IJTeamTableItem[] {
    return JRankCalculator.getTableBase(this, m => m.state === 'finished');
  }

  get isFinished(): boolean {
    return this.matches.every((m: JMatch) => m.state === 'finished');
  }

  assign(teams: arr2<JTeam>[], cal: JCalendar): void { // solo una vez?

    teams.forEach((teamsPair: arr2<JTeam>) => {
      this._teams.push(teamsPair[0])
      this._teams.push(teamsPair[1])
    })

    cal.addEvent(new JEventRoundCreationAndTeamsDraw({ // crear eventos de draw y round creation
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this._roundHalfWeeksSchedule[0], this.config.season, 'start', 12).getIJDateTimeCreator(),
      calendar: cal,
      playoff: this,
      teams
    }))

    for (let i = 1; i < this._roundsNumber; i++) {
      cal.addEvent(new JEventRoundCreationAndTeamsDraw({ // crear el eventos de draw y round creation
        dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this._roundHalfWeeksSchedule[i], this.config.season, 'start', 12).getIJDateTimeCreator(),
        calendar: cal,
        playoff: this,
      }))
    }
  }

  getLastRoundWinners(): JTeam[] {
    let n: number = this._rounds.length;
    return this._rounds[n - 1].winners;
  }

  newRound(teamsDrawSorted: arr2<JTeam>[], calendar: JCalendar, dt: JDateTime) {

    const round: JRound = new JRound({
      num: this._rounds.length + 1,
      series: this.generateSeries(teamsDrawSorted!),
      halfweeks: this._roundHalfWeeks[this._rounds.length],
      halfweekMatchDateAssignation: this._roundHalfWeeksSchedule[this._rounds.length],
    })

    round.generateMatchOfRoundScheduleEvents(calendar, this, dt);
    this._rounds.push(round);

  }

  generateSeries(teams: arr2<JTeam>[]): JSerie[] {
    // console.log('presentados para generar serie', teams.length);
    let out: JSerie[] = [];
    
    const total: number = this.matches.length/(this.config.isIV ? 2 : 1);
    teams.forEach((teamsPair: arr2<JTeam>, idx: number) => {
      out.push(
        new JSerie({
          teamOne: teamsPair[0],
          teamTwo: teamsPair[1],
          id: `${this.id}-S${total+idx+1}`,
          isIV: this.config.isIV,
          season: this.config.season,
          hws: this.config.roundHalfWeeks[this._rounds.length],
          isNeutral: this.config.isNeutral,
        })
      )
    })

    return out;
  }

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
}