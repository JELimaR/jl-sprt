import { IJDateTime, IJDateTimeCreator, JDateTime } from "../../Calendar/DateTime/JDateTime";
import { TypeDayOfYear, TypeHalfWeekOfYear, TypeIntervOfDay } from "../../Calendar/DateTime/types";
import JCalendar from "../../Calendar/JCalendar";
import { ITCCConfig, ITCCInfo, TCC } from "../../patterns/templateConfigCreator";
import { JRankItem, TypeRanking } from "../Rank/JRank";
import Team from "../Team";
import Bombo from "./Bombo";
import { Event_StagePlayoffEnd } from "./StagePlayoff/Event_StagePlayoffEnd";
import { Event_StagePlayoffStart } from "./StagePlayoff/Event_StagePlayoffStart";

type TQualyCondition = {
  rankId: string; // puede ser un tournament u otro rank
  season: 'current' | 'previus'; // innecesario?
  minRankPos: number;
  maxRankPos: number;
}

type TypeDrawRulePlayoff = {}

export type TypeBomboData = { elemsNumber: number, selectionPerTime: number }

export interface IStageConfig extends ITCCConfig {
  type: 'group' | 'playoff';
  // bsConfig: IBaseStageConfig;
  // pueden ser halfweeks
  dayOfDrawDate?: {day: TypeDayOfYear, interv: TypeIntervOfDay}; // puede ser neceario solo para crear un evento que muestre un sorteo
  halfWeekOfStartDate: TypeHalfWeekOfYear;
  halfWeekOfEndDate: TypeHalfWeekOfYear; // agregar validaciones en BaseStage con esto
  
  drawRulesValidate: TypeDrawRulePlayoff[]; // reglas que validan un sorteo
  // boolean que define si hay o no sorteo

  qualifyConditions: TQualyCondition[];

  bombos: TypeBomboData[];

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

    this.getHalfWeekOfMatches().forEach((hw: TypeHalfWeekOfYear) => {
      // const dayOfYear = JDateTime.halfWeekOfYearToDaysOfYear(hw).start;
      // console.log(dayOfYear < config.dayOfStartDate)
    })

    const startEvent = new Event_StagePlayoffStart({
      calendar: calendar, 
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(config.halfWeekOfStartDate, info.season, 'start').getIJDateTimeCreator(), 
      stage: this
    })

    const endEvent = new Event_StagePlayoffEnd({
      calendar: calendar, 
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(config.halfWeekOfEndDate, info.season, 'end', 299).getIJDateTimeCreator(), 
      stage: this
    })

    calendar.addEvent(startEvent);
    calendar.addEvent(endEvent);
  }

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
    this.config.bombos.forEach((bomboData: TypeBomboData) => {
      const elements: Team[] = [];
      for (let i = 0; i < bomboData.elemsNumber; i++) {
        elements.push(teams[tid]);
        tid++;
      }
      out.push(new Bombo(elements, bomboData.selectionPerTime));
    })

    return out;
  }

  getParticipants(globalRanksMap: Map<string, JRankItem[]>) { // cambiar Map por TypeRanking
    const teams: Team[] = [];
    this.config.qualifyConditions.forEach(qc => {
      const ranking = globalRanksMap.get(qc.rankId)!; // verificar correctamente

      if (ranking.length < qc.maxRankPos) throw new Error(``)

      for (let p = qc.minRankPos - 1; p < qc.maxRankPos; p++)
        teams.push(ranking[p].team);
    })

    return teams;
  }
}
export type TYPEGENERICSTAGE = Stage<IStageInfo, IStageConfig>;