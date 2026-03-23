import BaseStage from '../../BaseStage';
import JCalendar from '../../../../JCalendar/JCalendar';
import { Round } from './Round';
import Event_RoundCreationAndTeamsDraw from './Event_RoundCreationAndTeamsDraw';
import { JDateTime } from '../../../../JCalendar/JDateTimeModule';
import { IElementInfo, ISingleElminationConfig } from '../../../../JSportModule';
import Team from '../../../../JSportModule/data/Team';
import { AnyTeamTableItem } from '../../../../JSportModule/Ranking/A_TeamTableItem';
import { ISportProfile } from '../../../../JSportModule/profiles/ISportProfile';
import { TypeTableMatchState } from '../../../../JSportModule/';
import Match from '../../../../JSportModule/Match/ScoreMatch';
import JSerie from '../../../../JSportModule/Match/Serie';

// export interface IElementInfo extends IBaseStageInfo { }

export default class SingleElmination extends BaseStage<IElementInfo, ISingleElminationConfig> { // Single elimination

  private _rounds: Round[] = [];

  constructor(info: IElementInfo, config: ISingleElminationConfig, sportProfile: ISportProfile<unknown, string, string>) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config, sportProfile);
  }

  constructorVerification(config: ISingleElminationConfig): void {
    if (SingleElmination.maxNumberRound(config.participantsNumber) < config.roundsNumber) {
      throw new Error(`la cantidad de rounds: ${config.roundsNumber} es
      mayor a la cantidad posible de rounds: ${SingleElmination.maxNumberRound(config.participantsNumber)} para la cantidad de
      participants: ${config.participantsNumber}`)
    }

  }

  get isFinished(): boolean {
    return super.isFinished && this._rounds.length == this.config.roundsNumber
  }

  get rounds(): Round[] { return this._rounds }
  get matches(): Match[] {
    let out: Match[] = [];
    this._rounds.forEach((r: Round) => {
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
        dateTime: dt.getIJDateTimeCreator(),
        calendar: cal,
        playoff: this,
      }))
    }
  }

  createNewRound(teamsDrawSorted: Team[], calendar: JCalendar) {
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

  getTable(ttms: TypeTableMatchState): AnyTeamTableItem[] {
    let out = this.calcTableValues(ttms);

    this.rounds.forEach((r: Round, idx: number) => {
      r.losers.forEach((loser: Team) => {
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