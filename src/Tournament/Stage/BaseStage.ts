import JCalendar from "../../Calendar/JCalendar";
import Team from "../Team";
import JMatch from "../Match/JMatch";
import { ITCCConfig, ITCCInfo, TCC } from "../../patterns/templateConfigCreator";
import { TypeTableMatchState } from "../Rank/JRank";

/**
 * En el BaseStage es donde se configuran las rondas o turnos y los partidos de un torneo.
 * Pueden implementar una eliminacion simple directa o un robinround de todos contra todos.
 */

export interface IBaseStageConfig extends ITCCConfig {
  participantsNumber: number;
  isIV: boolean;
  isNeutral: boolean;
}

export interface IBaseStageInfo extends ITCCInfo {
  id: string;
  season: number;
}

export default abstract class BaseStage<I extends IBaseStageInfo, C extends IBaseStageConfig> extends TCC<I, C> {

  /**
   * Creacion de una SB. Se asigna la config y la info
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
    // assign participants and table items
    participants.forEach((team: Team, idx: number) => {
      this.participants.set(idx + 1, team);
    })

    this.createChildren(cal);
  }
  abstract createChildren(cal: JCalendar): void;

  static teamsSortForDraw(teamRankArr: Team[], masmenos: boolean): Team[] {
    let out: Team[] = [];
    const total = teamRankArr.length;
    for (let i = 0; i < total/2; i++) {
      if (masmenos) {
        out.push(
          teamRankArr[total - i - 1], teamRankArr[i]
        )  
      } else {
        out.push(
          teamRankArr[i], teamRankArr[total - i - 1]
        )
      }
		}
    return out;
  }

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