
import JCalendar from "../../JCalendar/JCalendar";
import { JDateTime, TypeHalfWeekOfYear, TypeIntervalOfDay } from "../../JCalendar/JDateTimeModule";
import { ITCCConfig, ITCCInfo, TCC } from "../../patterns/templateConfigCreator";
import { RankItem, TypeRanking, TypeTableMatchState } from "../Rank/ranking";
import TeamTableItem from "../Rank/TeamTableItem";
import { IElementInfo } from "../types";
import { IBaseStageConfig } from "./BaseStage";
import Bombo from "./Bombo";
import { Event_StageEnd } from "./Event_StageEnd";
import { Event_StageStart } from "./Event_StageStart";

type TQualyCondition = {
  rankId: string;
  season: 'current' | 'previus'; // innecesario?
  minRankPos: number;
  maxRankPos: number;
}

export type TypeDrawRulePlayoff = { origin: 'all' | string, minCount: number }

export interface IStageConfig extends ITCCConfig {
  type: 'group' | 'playoff';
  bsConfig: IBaseStageConfig;

  halfWeekOfStartDate: TypeHalfWeekOfYear;
  intervalOfDrawDate?: TypeIntervalOfDay; // indica a que hora se visualiza el sorteo y si corresponde realizar el mismo
  halfWeekOfEndDate: TypeHalfWeekOfYear;

  drawRulesValidate: TypeDrawRulePlayoff[]; // reglas que validan un sorteo

  qualifyConditions: TQualyCondition[];

  bombos: number[];

}

/**
 * generar el start event
 * generar el end event
 */
export default abstract class Stage<I extends IElementInfo, C extends IStageConfig> extends TCC<I, C> {

  constructor(info: I, config: C, calendar: JCalendar) {
    super(info, config);

    /********************************************************************************************************************************************************************************************
     * Verificaciones 
     * ELIMINAR LAS DEPENDENCIAS DE "this"
     */
    if (config.halfWeekOfStartDate > config.halfWeekOfEndDate) {
      throw new Error(`La fecha de start ${config.halfWeekOfStartDate} debe ser menor a la de end ${config.halfWeekOfEndDate}.
      (Stage.constructor)`)
    }
    // fechas
    const halfWeekOfMatches = this.getHalfWeekOfMatches(); // ELIMINAR DEPENDENCIA DE THIS
    const halfweekOfSchedule = this.getHalfWeekOfSchedule(); // ELIMINAR DEPENDENCIA DE THIS

    for (let i = 0; i < halfWeekOfMatches.length; i++) {
      const j = (config.type == 'playoff' && config.bsConfig.opt == 'h&a') ? Math.trunc(i / 2) : i;
      // cada turn o round debe ser programada antes de que se ejecute
      if (halfWeekOfMatches[i] < halfweekOfSchedule[j]) {
        throw new Error(
          `no se cumple que halfWeekOfMatches (${halfWeekOfMatches[i]}) es menor a halfweekOfSchedule (${halfweekOfSchedule[i]}).
          Para ${info.id}. (Stage.constructor)`
        )
      }
      // cada turn o round debe ser ejecutada despues del inicio y antes del fin
      if (halfWeekOfMatches[i] < config.halfWeekOfStartDate || halfWeekOfMatches[i] > config.halfWeekOfEndDate) {
        throw new Error(
          `la hw Of Match ${halfWeekOfMatches[i]} debe estar entre la hw of start ${config.halfWeekOfStartDate} y la hw of end ${config.halfWeekOfEndDate}.
          Para ${info.id}. (Stage.constructor)`
        )
      }

      // cada turn o round debe ser programada despues del inicio y antes del fin
      if (halfweekOfSchedule[i] < config.halfWeekOfStartDate || halfweekOfSchedule[i] > config.halfWeekOfEndDate) {
        throw new Error(
          `la hw Of schedule ${halfweekOfSchedule[i]} debe estar entre la hw of start ${config.halfWeekOfStartDate} y la hw of end ${config.halfWeekOfEndDate}.
          Para ${info.id}. (Stage.constructor)`
        )
      }
    }

    // no debe haber fechas de matches repetidas
    if (halfWeekOfMatches.length !== new Set(halfWeekOfMatches).size) {
      throw new Error(`No pueden haber hw of matches repetidas:
      ${halfWeekOfMatches} - En ${info.id}.
      (Stage.constructor)`)
    }

    // la suma de clasificados debe coincidir con los participantes de los bombos!
    let sumRankingQualies = 0;
    config.qualifyConditions.forEach((qc: TQualyCondition) => sumRankingQualies += qc.maxRankPos - qc.minRankPos + 1);
    let bomboParticipantsCount = 0;
    config.bombos.forEach((b: number) => bomboParticipantsCount += b);
    if (sumRankingQualies !== bomboParticipantsCount) {
      throw new Error(`no coinciden ${sumRankingQualies} y ${bomboParticipantsCount} (Stage.constructor)`)
    }
    /********************************************************************************************************************************************************************************************/

    /**
     * Creacion y agenda de los eventos de inio y fin del stage (Event_StageStart y Event_StageEnd)
     */
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

  abstract getHalfWeekOfMatches(): TypeHalfWeekOfYear[];
  abstract getHalfWeekOfSchedule(): TypeHalfWeekOfYear[];

  abstract drawRulesValidate(team: RankItem[]): boolean;

  /**
   * Sorteo y asignacion de equipos a BaseStage!!
   * @param teams 
   * @param cal 
   */
  abstract start(teams: RankItem[], cal: JCalendar): void;

  /**
   * creación de los bombos para el sorteo
   */
  createBombosforDraw(teams: RankItem[]): Bombo<RankItem>[] {
    let out: Bombo<RankItem>[] = [];
    let tid = 0;
    this.config.bombos.forEach((elemsInBombo: number) => {
      const elements: RankItem[] = [];
      for (let i = 0; i < elemsInBombo; i++) {
        elements.push(teams[tid]);
        tid++;
      }
      out.push(new Bombo(elements));
    })
    return out;
  }

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
      table: rankItemArr,
    }
  }
}
