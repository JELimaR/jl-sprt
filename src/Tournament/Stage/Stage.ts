import { JDateTime } from "../../Calendar/DateTime/JDateTime";
import { TypeDayOfYear, TypeHalfWeekOfYear, TypeIntervOfDay } from "../../Calendar/DateTime/types";
import JCalendar from "../../Calendar/JCalendar";
import { ITCCConfig, ITCCInfo, TCC } from "../../patterns/templateConfigCreator";
// import { TypeRanking } from "../Rank/JRank";
import Team from "../Team";
import { IBaseStageConfig } from "./BaseStage";
import Bombo from "./Bombo";
import { Event_StageEnd } from "./Event_StageEnd";
import { Event_StageStart } from "./Event_StageStart";

type TQualyCondition = {
  rankId: string; // puede ser un tournament u otro rank
  season: 'current' | 'previus'; // innecesario?
  minRankPos: number;
  maxRankPos: number;
}

type TypeDrawRulePlayoff = {}

// export type TypeBomboData = { elemsNumber: number }

export interface IStageConfig extends ITCCConfig {
  type: 'group' | 'playoff';
  bsConfig: IBaseStageConfig;
  // pueden ser halfweeks
  dayOfDrawDate?: {day: TypeDayOfYear, interv: TypeIntervOfDay}; // puede ser neceario solo para crear un evento que muestre un sorteo
  halfWeekOfStartDate: TypeHalfWeekOfYear;
  halfWeekOfEndDate: TypeHalfWeekOfYear; // agregar validaciones en BaseStage con esto
  
  drawRulesValidate: TypeDrawRulePlayoff[]; // reglas que validan un sorteo
  // boolean que define si hay o no sorteo

  qualifyConditions: TQualyCondition[];

  bombos: number[];

}

export interface IStageInfo extends ITCCInfo {
  season: number;
}

/**
 * generar el start event
 * generar el end event
 */
export default abstract class Stage<I extends IStageInfo, C extends IStageConfig> extends TCC<I, C> {
  
  constructor(info: I, config: C, calendar: JCalendar) {
    super(info, config);

    // verificaciones
    const halfWeekOfMatches = this.getHalfWeekOfMatches();
    const halfweekOfSchedule = this.getHalfWeekOfSchedule();
    for (let i = 0; i < halfWeekOfMatches.length; i++) {
      const j = (this.config.type == 'playoff' && this.config.bsConfig.opt == 'h&a') ? Math.trunc(i/2) : i;
      if (halfWeekOfMatches[i] < halfweekOfSchedule[j]) {
        throw new Error(
          `no se cumple que halfWeekOfMatches (${halfWeekOfMatches[i]}) es menor a halfweekOfSchedule (${halfweekOfSchedule[i]}).
          Para ${this.info.id}.`
          )
      }

      if (halfWeekOfMatches[i] < config.halfWeekOfStartDate || halfWeekOfMatches[i] > config.halfWeekOfEndDate) {
        throw new Error(
          `la hw Of Match ${halfWeekOfMatches[i]} debe estar entre la hw of start ${config.halfWeekOfStartDate} y la hw of end ${config.halfWeekOfEndDate}.
          Para ${this.info.id}.`
          )
      }

      if (halfweekOfSchedule[i] < config.halfWeekOfStartDate || halfweekOfSchedule[i] > config.halfWeekOfEndDate) {
        throw new Error(
          `la hw Of schedule ${halfweekOfSchedule[i]} debe estar entre la hw of start ${config.halfWeekOfStartDate} y la hw of end ${config.halfWeekOfEndDate}.
          Para ${this.info.id}.`
          )
      }

    }
    
    if (halfWeekOfMatches.length !== new Set(halfWeekOfMatches).size) {
      throw new Error(`No pueden haber hw of matches repetidas:
      ${halfWeekOfMatches} - En ${this.info.id}`)
    }

    const startEvent = new Event_StageStart({
      calendar: calendar, 
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(config.halfWeekOfStartDate, info.season, 'start').getIJDateTimeCreator(), 
      stage: this
    })

    const endEvent = new Event_StageEnd({
      calendar: calendar, 
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(config.halfWeekOfEndDate, info.season, 'end', 299).getIJDateTimeCreator(), 
      stage: this
    })

    calendar.addEvent(startEvent);
    calendar.addEvent(endEvent);
  }

  abstract get isFinished(): boolean;
  // abstract getState(): 'created' | 'started' | 'ended';

  abstract getHalfWeekOfMatches(): TypeHalfWeekOfYear[];
  abstract getHalfWeekOfSchedule(): TypeHalfWeekOfYear[];

  abstract drawRulesValidate(team: Team[]): boolean;

  /**
   * Sorteo y asignacion de equipos a BaseStage!!
   * @param teams 
   * @param cal 
   */
  abstract start(teams: Team[], cal: JCalendar): void;

  createBombosforDraw(teams: Team[]): Bombo<Team>[] {

    let out: Bombo<Team>[] = [];
    let tid = 0;
    this.config.bombos.forEach((bomboData: number) => {
      const elements: Team[] = [];
      for (let i = 0; i < bomboData; i++) {
        elements.push(teams[tid]);
        tid++;
      }
      out.push(new Bombo(elements, this.getSelectionPerTime(elements.length)));
    })
    return out;
  }

  abstract getSelectionPerTime(elementsNumber: number): number;

}
export type TYPEGENERICSTAGE = Stage<IStageInfo, IStageConfig>;