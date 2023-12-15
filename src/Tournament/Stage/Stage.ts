
import JCalendar from "../../JCalendar/JCalendar";
import { JDateTime, TypeHalfWeekOfYear, TypeIntervalOfDay } from "../../JCalendar/JDateTimeModule";
import { IElementInfo, IStageConfig, TCC, TQualyCondition } from "../../JSportModule";
import { IRankItem } from "../../JSportModule/data/Ranking/interfaces";
import { Ranking } from "../../JSportModule/data/Ranking/Ranking";
import TeamTableItem from "../../JSportModule/data/Ranking/TeamTableItem";
import { TypeTableMatchState } from "../Rank/ranking";
import Bombo from "./Bombo";
import { Event_StageEnd } from "./Event_StageEnd";
import { Event_StageStart } from "./Event_StageStart";


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
    if (config.hwStart > config.hwEnd) {
      throw new Error(`La fecha de start ${config.hwStart} debe ser menor a la de end ${config.hwEnd}.
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
      if (halfWeekOfMatches[i] < config.hwStart || halfWeekOfMatches[i] > config.hwEnd) {
        throw new Error(
          `la hw Of Match ${halfWeekOfMatches[i]} debe estar entre la hw of start ${config.hwStart} y la hw of end ${config.hwEnd}.
          Para ${info.id}. (Stage.constructor)`
        )
      }

      // cada turn o round debe ser programada despues del inicio y antes del fin
      if (halfweekOfSchedule[i] < config.hwStart || halfweekOfSchedule[i] > config.hwEnd) {
        throw new Error(
          `la hw Of schedule ${halfweekOfSchedule[i]} debe estar entre la hw of start ${config.hwStart} y la hw of end ${config.hwEnd}.
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
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(config.hwStart, info.season, 'start').getIJDateTimeCreator(),
      stage: this
    })

    const endEvent = new Event_StageEnd({
      calendar: calendar,
      dateTime: JDateTime.createFromHalfWeekOfYearAndYear(config.hwEnd, info.season, 'end', 299).getIJDateTimeCreator(),
      stage: this
    })

    calendar.addEvent(startEvent);
    calendar.addEvent(endEvent);
  }

  abstract get isFinished(): boolean;

  abstract getHalfWeekOfMatches(): TypeHalfWeekOfYear[];
  abstract getHalfWeekOfSchedule(): TypeHalfWeekOfYear[];

  abstract drawRulesValidate(team: IRankItem[]): boolean;

  /**
   * Sorteo y asignacion de equipos a BaseStage!!
   * @param teams 
   * @param cal 
   */
  abstract start(teams: IRankItem[], cal: JCalendar): void;

  /**
   * creación de los bombos para el sorteo
   */
  createBombosforDraw(teams: IRankItem[]): Bombo<IRankItem>[] {
    let out: Bombo<IRankItem>[] = [];
    let tid = 0;
    this.config.bombos.forEach((elemsInBombo: number) => {
      const elements: IRankItem[] = [];
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
  getRelativeRank(): Ranking {
    let ttis: TeamTableItem[] = this.getTable('finished');

    const rankItemArr: IRankItem[] = ttis.map((tti, idx) => {
      return {
        team: tti.team,
        pos: idx + 1,
        origin: tti.bsId
      }
    })

    return Ranking.fromTypeRanking({
      context: `rs_${this.config.idConfig}`,
      items: rankItemArr,
      teams: rankItemArr.map(item => item.team),
    })
  }
}
