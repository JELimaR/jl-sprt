import JCalendar from "../../JCalendar/JCalendar";
import Team from "../Team";
import JMatch from "../Match/JMatch";
import { ITCCConfig, ITCCInfo, TCC } from "../../patterns/templateConfigCreator";
import TeamTableItem from "../Rank/TeamTableItem";
import { TypeTableMatchState } from "../Rank/ranking";
import { IElementInfo } from "../types";

/**
 * En el BaseStage es donde se configuran las rondas o turnos y los partidos de un torneo.
 * Pueden implementar una eliminacion simple directa o un robinround de todos contra todos.
 */

export type TypeBaseStageOption = 'home' | 'h&a' | 'neutral'
export interface IBaseStageConfig extends ITCCConfig {
  participantsNumber: number;
  // isIV: boolean;
  // isNeutral: boolean;
  opt: TypeBaseStageOption;
}

// export interface IElementInfo extends ITCCInfo {
//   id: string;
//   season: number;
// }

export default abstract class BaseStage<I extends IElementInfo, C extends IBaseStageConfig> extends TCC<I, C> {

  /**
   * Creacion de una BS. Se asigna la config y la info
   * Quedan desconocidos los participants y por tanto no se crean los turns/rounds
   *        -> ESTOS SE CREAN EN LA ASIGNACION -> función assign()
   * 
   */
  private _participants: Map<number, Team> = new Map<number, Team>();

  constructor(info: I, config: C) {
    super(info, config);
    this.constructorVerification(config);
  }

  abstract constructorVerification(config: C): void;

  abstract get matches(): JMatch[];

  get isFinished(): boolean {
    return this.matches.every((m: JMatch) => m.state === 'finished');
  }

  get participants(): Map<number, Team> { return this._participants }
  get teamsArr(): Team[] { 
    const teams: Team[] = [];
    this.participants.forEach((t: Team) => teams.push(t));
    return teams;
   }

  /**
   * En la asignacion de los participantes, se deben crear los correspondientes turns/rounds segun corresponda
   */
  assign(participants: Team[], cal: JCalendar): void {
    if (this.config.participantsNumber !== participants.length) {
      throw new Error(`cantidad de tms incorrecta:
      presentados: ${participants.length} y se esperaban: ${this.config.participantsNumber}`);
    }
    // verificar que no se repitan
    // assign participants and table items
    participants.forEach((team: Team, idx: number) => {
      this.participants.set(idx + 1, team);
    })

    this.createChildren(cal);
  }
  abstract createChildren(cal: JCalendar): void;

  /**
   * 
   */
  calcTableValues(ttms: TypeTableMatchState): TeamTableItem[] {
    // para cada match, calcular los valores de la tabla de de cada team!
    // valores: pg, pp, pg, pe, gf, ge
    const out: TeamTableItem[] = []; // pasar a map
    this.participants.forEach((team: Team) => out.push(new TeamTableItem(team, this.info.id)));
    // 
    const matchConditionFunc = BaseStage.getTableCondition(ttms);
  
    this.matches.forEach((m: JMatch) => {
      if (matchConditionFunc(m) && !!m.result) {
        let htti: TeamTableItem | undefined = out.find(t => t.team.id === m.homeTeam.id);
        let atti: TeamTableItem | undefined = out.find(t => t.team.id === m.awayTeam.id);
  
        if (htti && atti) {
          // gls HT
          htti.addGf(m.result.teamOneScore.score);
          htti.addGe(m.result.teamTwoScore.score);
          // gls AT
          atti.addGf(m.result.teamTwoScore.score);
          atti.addGe(m.result.teamOneScore.score);
          // add pj
          if (m.result.teamWinner === htti.team.id) {
            htti.addPg();
            atti.addPp();
          } else if (m.result.teamWinner === atti.team.id) {
            htti.addPp();
            atti.addPg();
          } else {
            htti.addPe();
            atti.addPe();
          }
        } else throw new Error(`non finded`);
      }
    })
  
    return out;
  }

  /**
   * 
   * @param ttms 
   */
  static getTableCondition(ttms: TypeTableMatchState): (m: JMatch) => boolean {
    switch (ttms) {
      case 'partial':
        return (m => m.state === 'finished' || m.state === 'playing');
      case 'finished':
        return (m => m.state === 'finished');
      default:
        throw new Error('asdfghdhgf');
    }
  }
}