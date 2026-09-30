import { BaseStage } from '../../BaseStage';
import { JCalendar, JDateTime } from "jl-calendar";
import { Round } from './Round';
import { Event_RoundCreationAndTeamsDraw } from './Event_RoundCreationAndTeamsDraw';
import { IElementInfo, ISingleEliminationConfig } from '../../../../JSportModule';
import { AnyTeam } from 'jl-sprt-core';
import { AnyTeamTableItem } from 'jl-sprt-core';
import { AnySportProfile } from 'jl-sprt-core';
import { A_Serie } from 'jl-sprt-core';
import { TypeTableMatchState } from '../../../../JSportModule/';
import { AnyMatch } from 'jl-sprt-core';

export class SingleElimination extends BaseStage<IElementInfo, ISingleEliminationConfig> { // Single elimination

  private _rounds: Round[] = [];

  constructor(info: IElementInfo, config: ISingleEliminationConfig, sportProfile: AnySportProfile) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config, sportProfile);
  }

  constructorVerification(config: ISingleEliminationConfig): void {
    if (SingleElimination.maxNumberRound(config.participantsNumber) < config.roundsNumber) {
      throw new Error(`la cantidad de rounds: ${config.roundsNumber} es
      mayor a la cantidad posible de rounds: ${SingleElimination.maxNumberRound(config.participantsNumber)} para la cantidad de
      participants: ${config.participantsNumber}`)
    }

  }

  get isFinished(): boolean {
    return super.isFinished && this._rounds.length == this.config.roundsNumber
  }

  get rounds(): Round[] { return this._rounds }
  get matches(): AnyMatch[] {
    let out: AnyMatch[] = [];
    this._rounds.forEach((r: Round) => {
      r.matches.forEach((m) => out.push(m));
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
      let dt = JDateTime.createFromHalfWeekOfYearAndYear(
        this.config.roundHalfWeeksSchedule[i],
        this.info.season, 'start')
      if (cal.now.absolute >= dt.absolute) {
        dt = cal.now;
        dt.addInterv(1);
        if (cal.now.absolute - dt.absolute > 50) {
          throw new Error(`stop
          En Round.generateMatchOfRoundScheduleEvents`)
        }
      }
      cal.addEvent(new Event_RoundCreationAndTeamsDraw({ // crear los eventos de draw y round creation
        dateTime: dt.getCreator(),
        calendar: cal,
        playoff: this,
      }))
    }
  }

  createNewRound(teamsDrawSorted: AnyTeam[], calendar: JCalendar) {
    const roundNumber: number = this._rounds.length + 1;
    const roundIndex: number = this._rounds.length;
    const round: Round = new Round({
      num: roundNumber,
      series: this.createRoundSeries(teamsDrawSorted!),
      halfweeks: this.config.roundHalfWeeks[roundIndex],
      halfweekSchedule: this.config.roundHalfWeeksSchedule[roundIndex],
    })

    round.generateMatchOfRoundScheduleEvents(calendar, this);
    this._rounds.push(round);
  }

  createRoundSeries(teams: AnyTeam[]): A_Serie<any, any>[] {
    let out: A_Serie<any, any>[] = [];

    const total: number = this.matches.length / ((this.config.opt == 'h&a') ? 2 : 1);
    for (let i = 0; i < teams.length; i += 2) {
      out.push(
        this._sportProfile.createSerie({
          teamOne: teams[i + 0],
          teamTwo: teams[i + 1],
          id: `${this.info.id}-S${total + i / 2 + 1}`,
          season: this.info.season,
          hws: this.config.roundHalfWeeks[this._rounds.length],
          opt: this.config.opt,
        })
      )
    }

    return out;
  }

  getTable(ttms: TypeTableMatchState): AnyTeamTableItem[] {
    let out = this.calcTableValues(ttms);

    this.rounds.forEach((r: Round, idx: number) => {
      r.losers.forEach((loser: AnyTeam) => {
        let item = out.find((value) => value.team.id === loser.id)
        if (item) item.pos = this.rounds.length + 1 - idx;
      })
    });

    if (out.length > 0) {
      const sortFunc = out[0].getSortFunc();
      out.sort((a, b) => sortFunc(a, b, true));
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
  static teamsSortForDraw(teamRankArr: AnyTeam[]): AnyTeam[] {
    let out: AnyTeam[] = [];
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