
import JCalendar from "../../../../JCalendar/JCalendar";
import { TypeHalfWeekOfYear } from "../../../../JCalendar/JDateTimeModule";
import JMatch from "../../../Match/JMatch";
import { TypeTableMatchState, simpleSortFunc } from "../../../Rank/ranking";
import TeamTableItem from "../../../Rank/TeamTableItem";
import Team from "../../../Team";
import { arr2, IElementInfo } from "../../../types";
import BaseStage, { IBaseStageConfig, TypeBaseStageOption } from "../../BaseStage";
import robinRoundSchedulingFunction from "./RoundRobin";
import { Turn } from "./Turn";

export interface ILeagueConfig extends IBaseStageConfig {
  turnHalfWeeks: TypeHalfWeekOfYear[];
  turnHalfWeeksSchedule: TypeHalfWeekOfYear[];
}

// export interface ILeagueInfo extends IBaseStageInfo { }

export default class League extends BaseStage<IElementInfo, ILeagueConfig> {

  private _turns: Turn[] = [];

  /**
   * Creacion de una League. Se asigna la config y la info
   * Quedan desconocidos los participants y por tanto no se crean los turns
   *        -> ESTOS SE CREAN EN LA ASIGNACION -> función assign()
   */
  constructor(info: IElementInfo, config: ILeagueConfig) { // FALTA VERIFICAR QUE CADA fechHalfWeeks sea mayor al fechHalfWeeksSchedule
    super(info, config);
    this.config.turnHalfWeeks = config.turnHalfWeeks;
    this.config.turnHalfWeeksSchedule = config.turnHalfWeeksSchedule;
  }

  /**
   * Se realizan las siguientes verificaciones
   * * existe sch para la cantidad de participants
   * * la cantidad de halfweeks asignada para cada turn coincide con la cantidad de turns que corresponde
   * * la cantidad de halfweeks asignada para la programacion de cada turn coincide con la cantidad de turns que corresponde
   */
  constructorVerification(config: ILeagueConfig): void {
    if (
      config.participantsNumber < 2 ||
      config.participantsNumber > 20 ||
      !Number.isInteger(config.participantsNumber)
    ) {
      throw new Error(`no existe sch para el valor: ${config.participantsNumber}`);
    }
    let sch: arr2<number>[][] = League.getDataScheduling(
      config.participantsNumber,
      config.opt,
    );
    if (sch.length !== config.turnHalfWeeks.length) {
      throw new Error(`cantidad de wks incorrecta
      se esperaban: ${sch.length} y se presentan: ${config.turnHalfWeeks.length}`);
    }
    if (
      config.turnHalfWeeks.length !== config.turnHalfWeeksSchedule.length
    ) {
      throw new Error(`cantidad de wks de assignation incorrecta
      se esperaban: ${config.turnHalfWeeks.length} y se presentan: ${config.turnHalfWeeksSchedule.length}`);
    }

  }

  get turns(): Turn[] {
    return this._turns;
  }

  get matches(): JMatch[] {
    let out: JMatch[] = [];
    this._turns.forEach((f: Turn) => {
      f.matches.forEach((m: JMatch) => out.push(m));
    })
    return out;
  }

  /**
   * Para crear los turns
   * @param cal 
   */
  createChildren(cal: JCalendar): void {
    // matriz 
    let sch: arr2<number>[][] = League.getDataScheduling(
      this.config.participantsNumber,
      this.config.opt
    );

    for (let t = 0; t < sch.length; t++) {
      let teams: Team[] = [];
      for (let m of sch[t]) {
        const ht: Team = this.participants.get(m[0])!;
        const at: Team = this.participants.get(m[1])!;
        teams.push(ht);
        teams.push(at);
      }

      this.createNewTurn(teams, cal);
    }
  }

  createNewTurn(teamsDrawSorted: Team[], calendar: JCalendar) {
    const turnNumber: number = this._turns.length + 1;
    const turnIndex: number = this._turns.length;
    const turn: Turn = new Turn({
      num: this._turns.length + 1,
      matches: this.createTurnMatches(teamsDrawSorted, turnNumber),
      halfweek: this.config.turnHalfWeeks[turnIndex],
      halfweekSchedule: this.config.turnHalfWeeksSchedule[turnIndex],
    })

    turn.generateMatchOfTurnScheduleEvents(calendar, this);
    this._turns.push(turn);
  }

  createTurnMatches(teams: Team[], turnNumber: number): JMatch[] {
    let out: JMatch[] = [];

    const total: number = this.matches.length;
    for (let i = 0; i < teams.length; i += 2) {

      const match = new JMatch({
        awayTeam: teams[i],
        homeTeam: teams[i + 1],
        hw: this.config.turnHalfWeeks[turnNumber - 1],
        temp: this.info.season,
        id: `${this.info.id}-T${turnNumber}-M${total + i / 2 + 1}`,
        allowedDraw: true,
        isNeutral: this.config.opt == 'neutral'
      })

      out.push(match);
    }

    return out;
  }

  getTable(ttms: TypeTableMatchState): TeamTableItem[] {
    let out: TeamTableItem[] = this.calcTableValues(ttms);

    out.sort((a, b) => simpleSortFunc(a, b, false));

    out.forEach((itti, idx) => itti.pos = idx + 1)

    return out;
  }

  /************************************************************************************************************************************************************* */
  // statics
  static getTurnsNumber(n: number, opt: TypeBaseStageOption): number {
    let sch = League.getDataScheduling(n, opt);
    return sch.length;
  }
  static getCantMatches(n: number, opt: TypeBaseStageOption): number {
    let sch = League.getDataScheduling(n, opt);
    return sch.length * sch[0].length;
  }
  static getDataScheduling(n: number, opt: TypeBaseStageOption): arr2<number>[][] {
    return robinRoundSchedulingFunction(n, opt);
  }

  //
  static teamsSortForDraw(teamRankArr: Team[]) {
    let out: Team[] = [];

    let currUpIndex = 0;
    let currUnderIndex = teamRankArr.length - 1;

    let i = 0;
    let j = teamRankArr.length - 1;

    let pair = false;
    while (currUpIndex < currUnderIndex) {

      if (pair) {
        out[currUpIndex] = teamRankArr[j];
        j--;
        out[currUnderIndex] = teamRankArr[j];
        j--;
        pair = false;
      } else {
        out[currUpIndex] = teamRankArr[i];
        i++;
        out[currUnderIndex] = teamRankArr[i];
        i++;
        pair = true;
      }

      currUpIndex++;
      currUnderIndex--;
    }

    if (currUpIndex == currUnderIndex) {
      out[currUpIndex] = teamRankArr[i];
    }
    return out;
  }
}
