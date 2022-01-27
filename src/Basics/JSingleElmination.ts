import { TypeHalfWeekOfYear } from '../Calendar/DateTime/types';
import JCalendar from '../Calendar/JCalendar';
import JBombo from './JBombo';
import JTeam from './JTeam';
import { JRound } from './Round/JRound';
import JSerie from './Serie/JSerie';
import { JDateTime } from '../Calendar/DateTime/JDateTime';
import JEventRoundCreationAndTeamsDraw from './Round/JEventRoundCreationAndTeamsDraw';
import JMatch from './Match/JMatch';
import { arr2 } from './types';
import { ITeamTableItem } from './Rank/JTeamTableItem';
import { JRankCalculator } from './Rank/JRank';


export interface IJSingleElminationConfig {
  participantsNumber: number;
  roundsNumber: number;
  isIV: boolean;
  roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
  temp: number;
}

export default class JSingleElmination { // Single elimination
  _config: IJSingleElminationConfig;
  _rounds: JRound[] = [];
  _teams: JTeam[] = [];
  constructor(icc: IJSingleElminationConfig) {
    if (JSingleElmination.maxNumberRound(icc.participantsNumber) < icc.roundsNumber) {
      throw new Error(`la cantidad de rounds: ${icc.roundsNumber} es
      mayor a la cantidad posible de rounds: ${JSingleElmination.maxNumberRound(icc.participantsNumber)} para la cantidad de
      participants: ${icc.participantsNumber}`)
    }
    this._config = icc;
  }

  get config(): IJSingleElminationConfig { return this._config }
  get rounds(): JRound[] { return this._rounds }
  get matches(): JMatch[] {
    let out: JMatch[] = [];
    this._rounds.forEach((r: JRound) => {
      r.matches.forEach((m: JMatch) => out.push(m));
    })
    return out;
  }
  get teams(): JTeam[] { return this._teams }

  get table(): ITeamTableItem[] {
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
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this._config.roundHalfWeeksSchedule[0], this._config.temp, 'start').getIJDateTimeCreator(),
      calendar: cal,
      playoff: this,
      teams
    }))

    for (let i = 1; i < this._config.roundsNumber; i++) {
      cal.addEvent(new JEventRoundCreationAndTeamsDraw({ // crear el eventos de draw y round creation
        dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this._config.roundHalfWeeksSchedule[i], this._config.temp, 'start').getIJDateTimeCreator(),
        calendar: cal,
        playoff: this,
      }))
    }
  }

  newRound(teams: arr2<JTeam>[], calendar: JCalendar, dt: JDateTime) {

    const round: JRound = new JRound({
      num: this._rounds.length + 1,
      series: this.generateSeries(teams!),
      halfweeks: this._config.roundHalfWeeks[this._rounds.length],
      halfweekMatchDateAssignation: this._config.roundHalfWeeksSchedule[this._rounds.length],
    })

    round.generateSeriesAssignations(calendar, this, dt);
    this._rounds.push(round);

    // calendar.addEvent(
    //   new JEventStagePlayoffTeamsDraw({
    //     dateTime: dt.getIJDateTimeCreator(),
    //     calendar: calendar,
    //     stagePlayoff: this.element,
    //     bombos: this._tournament.getBombos(this.element.config.bombos, participants), // otra forma
    //   })
    // );
    // let series: JSerie[] = this.generateSeries( this._rounds[this._rounds.length-1].winners );

  }

  generateSeries(teams: arr2<JTeam>[]): JSerie[] {
    // console.log('presentados para generar serie', teams.length);
    let out: JSerie[] = [];
    const total = teams.length;
    teams.forEach((teamsPair: arr2<JTeam>) => {
      out.push(
        new JSerie({
          teamOne: teamsPair[0],
          teamTwo: teamsPair[1],
          id: 1,
          isIV: this._config.isIV,
          temp: this._config.temp,
          hws: this._config.roundHalfWeeks[this._rounds.length]
        })
      )
    })
    for (let i = 0; i < total; i++) {
    }

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