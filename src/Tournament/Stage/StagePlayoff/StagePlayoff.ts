
import SingleElmination, { ISingleElminationConfig, ISingleElminationInfo } from "./SingleElmination";
import Stage, { IStageConfig, IStageInfo } from "../Stage";
import { TypeHalfWeekOfYear } from "../../../Calendar/DateTime/types";
import { arr2 } from "../../types";
import Team from "../../Team";
import JCalendar from "../../../Calendar/JCalendar";
import { JDateTime } from "../../../Calendar/DateTime/JDateTime";
import { Event_StagePlayoffStart } from "./Event_StagePlayoffStart";
import { Event_StagePlayoffEnd } from "./Event_StagePlayoffEnd";
import Bombo from "../Bombo";

export interface IStagePlayoffConfig extends IStageConfig {
  type: 'playoff',
  playoff: ISingleElminationConfig;
}

export interface IStagePlayoffInfo extends IStageInfo { }

/**
 * Debe encargarse de la creacion y de la asignacion de los equipos a cada basestage
 * Para eso, debe crear cada basestage y agendar un evento start que genera las asignaciones a partir de un draw.
 * Tambien se debe generar un evento end para "dar aviso" de la finalizacion del stage
 */
export default class StagePlayoff extends Stage<IStagePlayoffInfo, IStagePlayoffConfig> {
 
  private _playoff: SingleElmination;

  constructor(info: IStagePlayoffInfo, config: IStagePlayoffConfig, calendar: JCalendar) {
    super(info, config);

    const SEInfo: ISingleElminationInfo = {
      id: '',
      season: this.info.season,
    }
    this._playoff = new SingleElmination(SEInfo, this.config.playoff);
    // ver si esto debe ir acá
    const startEvent = new Event_StagePlayoffStart({
      calendar: calendar, 
      dateTime: JDateTime.createFromDayOfYearAndYear(config.dayOfStartDate, info.season).getIJDateTimeCreator(), 
      stagePlayoff: this
    })

    const endEvent = new Event_StagePlayoffEnd({
      calendar: calendar, 
      dateTime: JDateTime.createFromDayOfYearAndYear(config.dayOfEndDate, info.season, 299).getIJDateTimeCreator(), 
      stagePlayoff: this
    })

    calendar.addEvent(startEvent);
    calendar.addEvent(endEvent);
  }

  get playoff(): SingleElmination { return this._playoff }

  get isFinished(): boolean {
  	return this._playoff.isFinished;
  }

  getHalfWeekOfMatches(): TypeHalfWeekOfYear[] {
    const out: TypeHalfWeekOfYear[] = [];
    this.config.playoff.roundHalfWeeks.forEach((value: arr2<TypeHalfWeekOfYear>) => {
      out.push(value[0]);
      out.push(value[1]);
    })
    return out;
  }

  getHalfWeekOfSchedule(): TypeHalfWeekOfYear[] {
    return this.config.playoff.roundHalfWeeksSchedule;
  }

  /**
   * Sorteo y asignacion de equipos a BaseStage!!
   * dado un array [T1,T2,T3,T4,T5,T6] el emparejamiento será:
   *    T6vsT1
   *    T5vsT2
   *    T4vsT3
   * @param teams 
   * @param cal 
   */
  start(teams: Team[], cal: JCalendar): void {
    const participants: Team[] = (false) ?  teams : this.teamsDraw(teams);
    this._playoff.assign(participants, cal);
  }

  private teamsDraw(teams: Team[]) {
    let sorted: Team[] = [];
    let i = 0; // conteo de la cantidad de intentos para un draw valido
    let isValid = false;
    const bombos = this.createBombosforDraw(teams);
    while (!isValid && i < 1000) { // mientras no encuentre un orden valido y no haya llegado a 1000 intentos
      bombos.forEach((bom: Bombo<Team>) => { bom.reset(); })
      sorted = this.selection(bombos);
      isValid = this.drawRulesValidate(sorted);
      i++;
    }
    return sorted;
  }

  private selection(bombos: Bombo<Team>[]) {
    const out: Team[] = [];
    bombos.forEach((bom: Bombo<Team>) => {
      // let elems = bom.getNextElements();
      // while (elems.length > 0) {
      //   out.push(...elems);
      //   elems = bom.getNextElements();
      // }
      let elems = bom.getAllElementsPlayoff();
      out.push(...elems);
    })
    return out;
  }

  // get relativeTable(): IJTeamTableItem[] {
  // 	return JRankCalculator.getTableStagePlayoff(this);
  // }
  // get rank(): ITeamTableItem[] { 
  // 	return JRankCalculator.getTableStagePlayoff(this);
  // }

  /**
   * dado un array [T1,T2,T3,T4,T5,T6] el emparejamiento será:
   *    T6vsT1
   *    T5vsT2
   *    T4vsT3
   */
  drawRulesValidate(teams: Team[]): boolean {
    const series: arr2<Team>[] = [];
    for (let i = 0; i < teams.length/2; i++) {
      let serie: arr2<Team> = [
        teams[i],
        teams[teams.length - 1 - i]
      ];
      series.push(serie);
    }
    
  	return true;
  }

  // halfWeekOfMatches(): TypeHalfWeekOfYear[] {
  //   let halfWeekOfMatches: Set<TypeHalfWeekOfYear> = new Set<TypeHalfWeekOfYear>();
  //   this._playoff.matches.forEach((match: JMatch) => {
  //     halfWeekOfMatches.add(match.date.getDateTime().date.halfWeekOfYear)
  //   })
  //   const out: TypeHalfWeekOfYear[] = [];
  //   halfWeekOfMatches.forEach((hw: TypeHalfWeekOfYear) => out.push(hw));
  //   return out;
  // }

}