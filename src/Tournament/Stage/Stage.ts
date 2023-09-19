import { JDateTime } from "../../Calendar/DateTime/JDateTime";
import { TypeDayOfYear, TypeHalfWeekOfYear, TypeIntervOfDay } from "../../Calendar/DateTime/types";
import JCalendar from "../../Calendar/JCalendar";
import { ITCCConfig, ITCCInfo, TCC } from "../../patterns/templateConfigCreator";
import { RankItem, TypeRanking, TypeTableMatchState } from "../Rank/ranking";
import TeamTableItem from "../Rank/TeamTableItem";
import { IBaseStageConfig } from "./BaseStage";
import Bombo, { IBomboInfo } from "./Bombo";
import { Event_StageEnd } from "./Event_StageEnd";
import { Event_StageStart } from "./Event_StageStart";
// import StageGroup, { IStageGroupConfig } from "./StageGroup/StageGroup";
// import StagePlayoff, { IStagePlayoffConfig } from "./StagePlayoff/StagePlayoff";

type TQualyCondition = {
  rankId: string; // puede ser un tournament u otro rank
  season: 'current' | 'previus'; // innecesario?
  minRankPos: number;
  maxRankPos: number;
}

type TypeDrawRulePlayoff = {}

export type TypeBomboData = {
  elemsNumber: number;
  selectionPerTime: number[];
}

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

  bombos: IBomboInfo[];

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
    // fechas
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
    
    // no hay fechas de partidos repetidas
    if (halfWeekOfMatches.length !== new Set(halfWeekOfMatches).size) {
      throw new Error(`No pueden haber hw of matches repetidas:
      ${halfWeekOfMatches} - En ${this.info.id}`)
    }

    // la suma de clasificados debe coincidir con los participantes de los bombos!
    let sumRankingQualies = 0;
    this.config.qualifyConditions.forEach((qc: TQualyCondition) => sumRankingQualies += qc.maxRankPos - qc.minRankPos + 1);
    let participantsCount = 0;
    // if (this.config.type == 'playoff') 
      // participantsCount = this.config.bsConfig.participantsNumber;
    // else {
      this.config.bombos.forEach((b: IBomboInfo) => participantsCount += b.elemsNumber)
    // }
    if (sumRankingQualies !== participantsCount) {
      throw new Error(`no coinciden ${sumRankingQualies} y ${participantsCount}`)
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

  abstract drawRulesValidate(team: RankItem[]): boolean;

  /**
   * Sorteo y asignacion de equipos a BaseStage!!
   * @param teams 
   * @param cal 
   */
  abstract start(teams: RankItem[], cal: JCalendar): void;

  createBombosforDraw(teams: RankItem[]): Bombo<RankItem>[] {
    let out: Bombo<RankItem>[] = [];
    let tid = 0;
    this.config.bombos.forEach((bomboInfo: IBomboInfo) => {
      const elements: RankItem[] = [];
      for (let i = 0; i < bomboInfo.elemsNumber; i++) {
        elements.push(teams[tid]);
        tid++;
      }

      if (this.config.type == 'playoff') {
        out.push(new Bombo(elements, [elements.length]));
      } else {
        out.push(new Bombo(elements, bomboInfo.selectionPerTime));
      }
    })
    return out;
  }

  // abstract getSelectionPerTime(elementsNumber: number): number;
  abstract getTable(ttms: TypeTableMatchState): TeamTableItem[];
  
  /**
   * 
   */
  getRelativeRank(): TypeRanking {
    let ttis: TeamTableItem[] = this.getTable('finished');

    const rankItemArr: RankItem[] = ttis.map((tti, idx) => {
      return {
        team: tti.team,
        rank: idx + 1,
        originId: tti.bsId
      }
    })

    return {
      rankId: 'sr_' + this.config.idConfig,
      // state: (stage.isFinished) ? 'final' : 'partial',
      table: rankItemArr,
    }
  }

  // static create(info: IStageInfo, config: IStageConfig, cal: JCalendar): Stage<any, any> {
  //   if (config.type == 'group') {
  //     const sconfig = config as IStageGroupConfig;
  //     return new StageGroup(info, sconfig, cal);
  //   } else if (config.type == 'playoff') {
  //     const sconfig = config as IStagePlayoffConfig;
  //     return new StagePlayoff(info, sconfig, cal);
  //   } else {
  //     throw new Error(`not implemented. (en StageConstructor)`)
  //   }
  // }

}
