import JCalendar from "../../JCalendar/JCalendar";
import Match from "../Match/JMatch";
import { IBaseStageConfig, IElementInfo, TCC } from "../../JSportModule";
import Team from "../../JSportModule/data/Team";
import TeamTableItem from "../../JSportModule/data/Ranking/TeamTableItem";
import { TypeTableMatchState } from "../../JSportModule/data/Ranking/interfaces";

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

  constructor(info: I, config: C) {
    super(info, config);
    this.constructorVerification(config);
  }

  abstract constructorVerification(config: C): void;

  abstract get matches(): Match[];

  get isFinished(): boolean {
    return this.matches.every((m: Match) => m.state === 'finished');
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
    // para cada match, calcular los valores de la tabla de cada team!
    const out: TeamTableItem[] = [];
    this.participants.forEach((team: Team) => out.push(new TeamTableItem(team, this.info.id)));
    // 
    const matchConditionFunc = BaseStage.getTableCondition(ttms);
  
    this.matches.forEach((m: Match) => {
      if (matchConditionFunc(m) && !!m.result) {
        let homeTTI: TeamTableItem | undefined = out.find(t => t.team.id === m.homeTeam.id);
        let awayTTI: TeamTableItem | undefined = out.find(t => t.team.id === m.awayTeam.id);
  
        if (homeTTI && awayTTI) {
          // gls HomeTeam
          homeTTI.addGf(m.result.teamOneScore.score);
          homeTTI.addGe(m.result.teamTwoScore.score);
          // gls AwayTeam
          awayTTI.addGf(m.result.teamTwoScore.score);
          awayTTI.addGe(m.result.teamOneScore.score);
          // add played matches
          if (m.result.teamWinner === homeTTI.team.id) { // para generalizar se debe modificar esto
            homeTTI.addWM();
            awayTTI.addLM();
          } else if (m.result.teamWinner === awayTTI.team.id) {
            homeTTI.addLM();
            awayTTI.addWM();
          } else {
            homeTTI.addDM();
            awayTTI.addDM();
          }
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
  static getTableCondition(ttms: TypeTableMatchState): (m: Match) => boolean {
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