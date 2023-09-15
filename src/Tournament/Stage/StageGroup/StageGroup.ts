import League, { ILeagueConfig, ILeagueInfo } from "./League";
import Stage, { IStageConfig, IStageInfo } from "../Stage";
import { TypeHalfWeekOfYear } from "../../../Calendar/DateTime/types";
import Team from "../../Team";
import JCalendar from "../../../Calendar/JCalendar";
import Bombo from "../Bombo";


export interface IStageGroupConfig extends IStageConfig {
  type: 'group',
  group: ILeagueConfig;

  // groupsNumber: number;
  participantsPerGroup: number[];
}

export interface IStageGroupInfo extends IStageInfo { }

/**
 * Debe encargarse de la creacion y de la asignacion de los equipos a cada basestage
 * Para eso, debe crear cada basestage y agendar un evento start que genera las asignaciones a partir de un draw.
 * Tambien se debe generar un evento end para "dar aviso" de la finalizacion del stage
 */
export default class StageGroup extends Stage<IStageGroupInfo, IStageGroupConfig> {

  private _groups: League[] = [];

  constructor(info: IStageGroupInfo, config: IStageGroupConfig, calendar: JCalendar) {
    super(info, config, calendar);

    for (let i = 0; i < config.participantsPerGroup.length; i++) {
      const GInfo: ILeagueInfo = {
        id: '' + i + 1,
        season: this.info.season,
      }
      const GConfig: ILeagueConfig = {...this.config.group};
      GConfig.participantsNumber = this.config.participantsPerGroup[i];
      const group = new League(GInfo, GConfig)
      this._groups.push(group)
    }

  }

  get groupsNumber(): number { return this.config.participantsPerGroup.length}

  get groups(): League[] { return this._groups }

  get isFinished(): boolean {
    return this._groups.every((g: League) => g.isFinished);
  }

  getHalfWeekOfMatches(): TypeHalfWeekOfYear[] {
    return this.config.group.turnHalfWeeks;
  }

  getHalfWeekOfSchedule(): TypeHalfWeekOfYear[] {
    return this.config.group.turnHalfWeeksSchedule;
  }

  getSelectionPerTime(elementsNumber: number): number {
    return Math.ceil(elementsNumber/this.groupsNumber);
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
  start(teams: Team[], cal: JCalendar): void {
    const participants: Team[][] = /*(this.config.dayOfDrawDate) ? this.teamsDraw(teams) : */this.teamsNoDraw(teams);
    // console.log(participants)
    this._groups.forEach((g: League,i: number) => {
      const arr = /*League.teamsSortForDraw(*/participants[i]/*, false)*/
      // console.log(i, [arr], g.config.participantsNumber)
      // console.log()
      g.assign(arr, cal);
    })
  }

  // no funciona bien -> esta mejorado
  /**
   * g  
   * 0	1	6	11	16
   * 1	2	7	12	13
   * 2	3	8	9	14
   * 3	4	5	10	15
   */
  private teamsNoDraw(teams: Team[]): Team[][] {
    let sorted: Team[][] = [];
    // teams = League.teamsSortForDraw(teams, false);
    let aksdfh = 0;
    let auxCounter = 0;
    teams.forEach((t: Team, tindx: number) => {
      // console.log('g', tindx % this.groups.length)
      if (auxCounter == this.groupsNumber) {
        auxCounter = 0;
        aksdfh++;
      }
      // const aux = Math.trunc(aksdfh/this.groupsNumber)
      const gid = (tindx + aksdfh) % this.groupsNumber;
      if (!sorted[gid]) sorted[gid] = [];
      
      sorted[gid].push(t);
      auxCounter++
    })
    sorted.sort((a: Team[], b: Team[]) => b.length - a.length)
    console.log(sorted)
    // throw new Error(`stop`)
    // this.groups.forEach((g: League, gi: number) => {
    //   let teamsGroup: Team[] = [];

    //   for (let i = 0; i < this.config.participantsPerGroup[gi]; i++) {
    //     teamsGroup.push(teams[ti]);
    //     ti++;
    //   }

    //   sorted.push(teamsGroup);
    // })

    return sorted
  }


  private teamsDraw(teams: Team[]): Team[][] {
    let sorted: Team[][] = [];
    let i = 0; // conteo de la cantidad de intentos para un draw valido
    let isValid = false;
    const bombos = this.createBombosforDraw(teams);
    while (!isValid && i < 1000) { // mientras no encuentre un orden valido y no haya llegado a 1000 intentos
      bombos.forEach((bom: Bombo<Team>) => { bom.reset(); })
      sorted = this.selection(bombos);

      isValid = true;
      sorted.forEach((tarr: Team[]) => {
        if (!this.drawRulesValidate(tarr)) isValid = false;
      })
      i++;
    }
    return sorted;
  }

  private selection(bombos: Bombo<Team>[]): Array<Team[]> {
    let out: Team[][] = [];
    this.groups.forEach(() => {
      let groupTeams: Team[] = [];
      bombos.forEach((b: Bombo<Team>) => {
        const elems = b.getNextElements();
        elems.forEach((t: Team) => { groupTeams.push(t); })
      })
      out.push(groupTeams);
    })
    return out;
  }

  // get relativeTable(): IJTeamTableItem[] {
  // 	return JRankCalculator.getTableStageGroup(this);
  // }
  // get rank(): ITeamTableItem[] { 
  // 	return JRankCalculator.getTableStageGroup(this);
  // }

  /**
   * dado un array [T1,T2,T3,T4,T5,T6] el emparejamiento será:
   */
  drawRulesValidate(teams: Team[]): boolean {
    
    return true;
  }

}