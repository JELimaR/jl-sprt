
// import Stage, { IStageConfig, IStageInfo } from "../Stage";
import SingleElmination, { ISingleElminationConfig, ISingleElminationInfo } from "./SingleElimination/SingleElmination";
import { TypeHalfWeekOfYear } from "../../../JCalendar/DateTime/types";
import JCalendar from "../../../JCalendar/JCalendar";
import { arr2 } from "../../types";
import Team from "../../Team";
import Bombo from "../Bombo";
import { RankItem, TypeRanking, TypeTableMatchState } from "../../Rank/ranking";
import { IStageConfig, IStageInfo, TypeDrawRulePlayoff } from "../Stage";
import Stage from "../Stage";
import TeamTableItem from "../../Rank/TeamTableItem";

export interface IStagePlayoffConfig extends IStageConfig {
  type: 'playoff',
  bsConfig: ISingleElminationConfig;
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
    super(info, config, calendar);

    const SEInfo: ISingleElminationInfo = {
      id: `${info.id}_SE`,
      season: this.info.season,
    }
    this._playoff = new SingleElmination(SEInfo, this.config.bsConfig);
  }

  get playoff(): SingleElmination { return this._playoff }

  get isFinished(): boolean {
    return this._playoff.isFinished;
  }

  getHalfWeekOfMatches(): TypeHalfWeekOfYear[] {
    const out: TypeHalfWeekOfYear[] = [];
    this.config.bsConfig.roundHalfWeeks.forEach((value: arr2<TypeHalfWeekOfYear>) => {
      out.push(value[0]);
      if (this.config.bsConfig.opt == 'h&a') out.push(value[1]);
    })
    return out;
  }

  getHalfWeekOfSchedule(): TypeHalfWeekOfYear[] {
    return this.config.bsConfig.roundHalfWeeksSchedule;
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
  start(teams: RankItem[], cal: JCalendar): void {
    const participants: Team[] = (this.config.dayOfDrawDate) ? this.teamsDraw(teams) : teams.map(ri => ri.team);
    this._playoff.assign(participants, cal);
  }

  private teamsDraw(teams: RankItem[]) {
    let sorted: RankItem[] = [];
    let i = 0; // conteo de la cantidad de intentos para un draw valido
    let isValid = false;
    const bombos = this.createBombosforDraw(teams);
    while (!isValid && i < 1000) { // mientras no encuentre un orden valido y no haya llegado a 1000 intentos
      bombos.forEach((bom: Bombo<RankItem>) => { bom.reset(); })
      sorted = this.selection(bombos);
      isValid = this.drawRulesValidate(sorted);
      i++;
    }
    return sorted.map(ri => ri.team);
  }

  private selection(bombos: Bombo<RankItem>[]) {
    const out: RankItem[] = [];
    // bombos.forEach((bom: Bombo<RankItem>) => {
    //   let elems = bom.getNextElements();
    //   out.push(...elems);
    // })

    bombos.forEach((b: Bombo<RankItem>) => {
      while (b.state !== 'finished') {
        const elem = b.getNextElement();
        out.push(elem);
      }
    })

    return out;
  }

  /**
   * dado un array [T1,T2,T3,T4,T5,T6] el emparejamiento será:
   *    T6vsT1
   *    T5vsT2
   *    T4vsT3
   */
  drawRulesValidate(teams: RankItem[]): boolean {
    const series: arr2<RankItem>[] = [];
    for (let i = 0; i < teams.length / 2; i++) {
      let serie: arr2<RankItem> = [
        teams[i],
        teams[teams.length - 1 - i]
      ];
      series.push(serie);
    }

    let out = true;

    this.config.drawRulesValidate.forEach((rule: TypeDrawRulePlayoff) => {

      series.forEach((s: arr2<RankItem>) => {
        if (rule.origin == 'all') {
          out = out && !(s[0].originId == s[1].originId);
        } else {
          out = out && !(s[0].originId == rule.origin && s[0].originId == s[1].originId);          
        }
      })

    })

    return out;
  }

  /**
   * 
   */
  getTable(ttms: TypeTableMatchState): TeamTableItem[] {
    return this.playoff.getTable(ttms);
  }

}