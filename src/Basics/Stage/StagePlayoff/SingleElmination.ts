import { TypeHalfWeekOfYear } from '../../../Calendar/DateTime/types';
import JCalendar from '../../../Calendar/JCalendar';
import Team from '../../Team';
import { JRound } from './Round/JRound';
import JSerie from '../../Match/JSerie';
import { JDateTime } from '../../../Calendar/DateTime/JDateTime';
import Event_RoundCreationAndTeamsDraw from './Round/Event_RoundCreationAndTeamsDraw';
import JMatch from '../../Match/JMatch';
import { arr2 } from '../../types';
import { ITeamTableItem } from '../../Rank/TeamTableItem';
import { JRankCalculator } from '../../Rank/JRank';
import StageBase, { IStageBaseConfig, IStageBaseInfo } from '../StageBase';


export interface ISingleElminationConfig extends IStageBaseConfig {
  roundsNumber: number;
  roundHalfWeeks: arr2<TypeHalfWeekOfYear>[];
  roundHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

export interface ISingleElminationInfo extends IStageBaseInfo {

}

export default class SingleElmination extends StageBase<ISingleElminationInfo, ISingleElminationConfig> { // Single elimination

  _rounds: JRound[] = [];
  _participants: Team[] = [];

  constructor(info: ISingleElminationInfo, config: ISingleElminationConfig) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config)
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
  get teams(): Team[] { return this._participants }

  get table(): ITeamTableItem[] {
    return JRankCalculator.getTableBase(this, m => m.state === 'finished');
  }

  assign(teams: Team[], cal: JCalendar): void { // solo una vez?

    if (this.config.participantsNumber !== teams.length) {
      throw new Error(`cantidad de tms incorrecta:
      presentados: ${teams.length} y se esperaban: ${this.config.participantsNumber}`);
    }

    teams.forEach((team: Team, idx: number) => {
			this._participants.push(team);
		})

    cal.addEvent(new Event_RoundCreationAndTeamsDraw({ // crear el evento de draw y round creation
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this.config.roundHalfWeeksSchedule[0], this.info.season, 'start', 12).getIJDateTimeCreator(),
      calendar: cal,
      playoff: this,
      teams
    }))

    for (let i = 1; i < this.config.roundsNumber; i++) {
      cal.addEvent(new Event_RoundCreationAndTeamsDraw({ // crear los eventos de draw y round creation
        dateTime: JDateTime.createFromHalfWeekOfYearAndYear(this.config.roundHalfWeeksSchedule[i], this.info.season, 'start', 12).getIJDateTimeCreator(),
        calendar: cal,
        playoff: this,
        // teams,
      }))
    }
  }

  getLastRoundWinners(): Team[] {
    let n: number = this._rounds.length;
    return this._rounds[n - 1].winners;
  }

  newRound(teamsDrawSorted: Team[], calendar: JCalendar, dt: JDateTime) {

    const round: JRound = new JRound({
      num: this._rounds.length + 1,
      series: this.generateSeries(teamsDrawSorted!),
      halfweeks: this.config.roundHalfWeeks[this._rounds.length],
      halfweekMatchDateAssignation: this.config.roundHalfWeeksSchedule[this._rounds.length],
    })

    round.generateMatchOfRoundScheduleEvents(calendar, this, dt);
    this._rounds.push(round);

  }

  generateSeries(teams: Team[]): JSerie[] {
    // console.log('presentados para generar serie', teams.length);
    let out: JSerie[] = [];
    
    const total: number = this.matches.length/(this.config.isIV ? 2 : 1);
    for (let i = 0; i < teams.length; i+=2) {
      out.push(
        new JSerie({
          teamOne: teams[i+0],
          teamTwo: teams[i+1],
          id: `${this.info.id}-S${total+i+1}`,
          isIV: this.config.isIV,
          season: this.info.season,
          hws: this.config.roundHalfWeeks[this._rounds.length],
          isNeutral: this.config.isNeutral,
        })
      )
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