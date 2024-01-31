
// import Stage, { IStageConfig, IStageInfo } from "../Stage";
import SingleElmination from "./SingleElimination/SingleElmination";
import JCalendar from "../../../JCalendar/JCalendar";
import Bombo from "../Bombo";
import Stage from "../Stage";
import { TypeHalfWeekOfYear } from "../../../JCalendar/JDateTimeModule";
import { IElementInfo, IStagePlayoffConfig, arr2, TypeDrawRulePlayoff } from "../../../JSportModule";
import { IRankItem, TypeTableMatchState } from "../../../JSportModule";
import Team from "../../../JSportModule/data/Team";
import TeamTableItem from "../../../JSportModule/Ranking/TeamTableItem";


/**
 * Debe encargarse de la creacion y de la asignacion de los equipos a cada basestage
 * Para eso, debe crear cada basestage y agendar un evento start que genera las asignaciones a partir de un draw.
 * Tambien se debe generar un evento end para "dar aviso" de la finalizacion del stage
 */
export default class StagePlayoff extends Stage<IElementInfo, IStagePlayoffConfig> {

  private _playoff: SingleElmination;

  constructor(info: IElementInfo, config: IStagePlayoffConfig, calendar: JCalendar) {
    super(info, config, calendar);

    const SEInfo: IElementInfo = {
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
  start(teams: IRankItem[], cal: JCalendar): void {
    const participants: Team[] = (this.config.intervalOfDrawDate) ? this.teamsDraw(teams) : teams.map(ri => ri.team);
    this._playoff.assign(participants, cal);
  }

  private teamsDraw(teams: IRankItem[]) {
    let sorted: IRankItem[] = [];
    let i = 0; // conteo de la cantidad de intentos para un draw valido
    let isValid = false;
    const bombos = this.createBombosforDraw(teams);
    while (!isValid && i < 1000) { // mientras no encuentre un orden valido y no haya llegado a 1000 intentos
      bombos.forEach((bom: Bombo<IRankItem>) => { bom.reset(); })
      sorted = this.selection(bombos);
      isValid = this.drawRulesValidate(sorted);
      i++;
    }
    return sorted.map(ri => ri.team);
  }

  private selection(bombos: Bombo<IRankItem>[]) {
    const out: IRankItem[] = [];
    
    bombos.forEach((b: Bombo<IRankItem>) => {
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
  drawRulesValidate(teams: IRankItem[]): boolean {
    const series: arr2<IRankItem>[] = [];
    for (let i = 0; i < teams.length / 2; i++) {
      let serie: arr2<IRankItem> = [
        teams[i],
        teams[teams.length - 1 - i]
      ];
      series.push(serie);
    }

    let out = true;

    this.config.drawRulesValidate.forEach((rule: TypeDrawRulePlayoff) => {

      series.forEach((s: arr2<IRankItem>) => {
        if (rule.origin == 'all') {
          out = out && !(s[0].origin == s[1].origin);
        } else {
          out = out && !(s[0].origin == rule.origin && s[0].origin == s[1].origin);          
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