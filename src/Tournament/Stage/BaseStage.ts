
import JCalendar from "../../JCalendar/JCalendar";
import { IBaseStageConfig, IElementInfo, TCC, TypeTableMatchState } from "../../JSportModule";
import Team from "../../JSportModule/data/Team";
import { A_Match } from "../../JSportModule/Match/A_Match";
import { A_TeamTableItem, AnyTeamTableItem } from "../../JSportModule/Ranking/A_TeamTableItem";
import { ISportProfile } from "../../JSportModule/profiles/ISportProfile";

/**
 * En el BaseStage es donde se configuran las rondas o turnos y los partidos de un torneo.
 * Pueden implementar una eliminacion simple directa o un robinround de todos contra todos.
 */

export default abstract class BaseStage<I extends IElementInfo, C extends IBaseStageConfig> extends TCC<I, C> {

  /**
   * Creacion de una BS. Se asigna la config y la info
   * Quedan desconocidos los participants y por tanto no se crean los turns/rounds
   *        -> ESTOS SE CREAN EN LA ASIGNACION -> función assign()
   * 
   */
  private _participants: Map<number, Team> = new Map<number, Team>();
  protected _sportProfile: ISportProfile<unknown, string, string>;

  constructor(info: I, config: C, sportProfile: ISportProfile<unknown, string, string>) {
    super(info, config);
    this._sportProfile = sportProfile;
    this.constructorVerification(config);
  }

  abstract constructorVerification(config: C): void;

  abstract get matches(): A_Match<unknown>[];

  get isFinished(): boolean {
    return this.matches.every((m) => m.state === 'finished');
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
   * Calcula los valores de la tabla para cada equipo a partir de los resultados de los partidos.
   * Usa el ISportProfile para crear los items y actualizar las estadísticas.
   */
  calcTableValues(ttms: TypeTableMatchState): AnyTeamTableItem[] {
    const out: AnyTeamTableItem[] = [];
    this.participants.forEach((team: Team) => out.push(this._sportProfile.createTableItem(team, this.info.id)));

    const matchConditionFunc = BaseStage.getTableCondition(ttms);
  
    this.matches.forEach((m) => {
      if (matchConditionFunc(m) && !!m.result) {
        let homeTTI = out.find(t => t.team.id === m.homeTeam.id);
        let awayTTI = out.find(t => t.team.id === m.awayTeam.id);
  
        if (homeTTI && awayTTI) {
          this._sportProfile.updateTableFromResult(homeTTI, m.result, homeTTI.team.id);
          this._sportProfile.updateTableFromResult(awayTTI, m.result, awayTTI.team.id);
        } else {
          throw new Error(`non finded
          En BaseStage.calcTableValues`);
        }
      }
    })
  
    return out;
  }

  /**
   * 
   * @param ttms 
   */
  static getTableCondition(ttms: TypeTableMatchState): (m: A_Match<unknown>) => boolean {
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
