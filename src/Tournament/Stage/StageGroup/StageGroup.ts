import League, { ILeagueConfig, ILeagueInfo } from "./League/League";
import Stage, { IStageConfig, IStageInfo, TypeDrawRulePlayoff } from "../Stage";
import { TypeHalfWeekOfYear } from "../../../JCalendar/DateTime/types";
import Team from "../../Team";
import JCalendar from "../../../JCalendar/JCalendar";
import Bombo from "../Bombo";
import { RankItem, simpleSortFunc, TypeTableMatchState } from "../../Rank/ranking";
import TeamTableItem from "../../Rank/TeamTableItem";


export interface IStageGroupConfig extends IStageConfig {
  type: 'group',
  bsConfig: ILeagueConfig;

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
        id: info.id + '_G' + (i + 1),
        season: this.info.season,
      }
      const GConfig: ILeagueConfig = { ...config.bsConfig };
      GConfig.participantsNumber = config.participantsPerGroup[i];
      const group = new League(GInfo, GConfig)
      this._groups.push(group)
    }

    /***********************************************************************************************************************************************************
     * VERIFICACIONES
     */
    let groupsParticipantsCount = 0;
    config.participantsPerGroup.forEach((g) => groupsParticipantsCount += g);
    let bomboParticipantsCount = 0;
    this.config.bombos.forEach((b: number) => bomboParticipantsCount += b)

    if (bomboParticipantsCount !== groupsParticipantsCount) {
      throw new Error(`En StageGroup constructor:
        La cantidad de participantes ${groupsParticipantsCount} no coincide con la cantidad definida por los bombos ${bomboParticipantsCount}`)
    }
    /***********************************************************************************************************************************************************/
  }

  get groupsNumber(): number { return this.config.participantsPerGroup.length }

  get groups(): League[] { return this._groups }

  get isFinished(): boolean {
    return this._groups.every((g: League) => g.isFinished);
  }

  getHalfWeekOfMatches(): TypeHalfWeekOfYear[] {
    return this.config.bsConfig.turnHalfWeeks;
  }

  getHalfWeekOfSchedule(): TypeHalfWeekOfYear[] {
    return this.config.bsConfig.turnHalfWeeksSchedule;
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
    const participants: Team[][] = (this.config.intervalOfDrawDate) ? this.teamsDraw(teams) : this.teamsNoDraw(teams);
    // console.log(participants)
    this._groups.forEach((g: League, i: number) => {
      const arr = League.teamsSortForDraw(participants[i]);
      // console.log(i, [arr], g.config.participantsNumber)
      // console.log()
      g.assign(arr, cal);
    })
  }
  /**
   * G	B1	B2	B3	B4
   * 0	1	6	11	16
   * 1	2	7	12	13
   * 2	3	8	9	14
   * 3	4	5	10	15
   * @param teams 
   */
  private teamsNoDraw(teams: RankItem[]): Team[][] {
    let sorted: RankItem[][] = [];
    // teams = League.teamsSortForDraw(teams, false);
    let gidOffset = 0;
    let auxCounter = 0;
    teams.forEach((t: RankItem, tindx: number) => {
      // console.log('g', tindx % this.groups.length)
      if (auxCounter == this.groupsNumber) {
        auxCounter = 0;
        gidOffset++;
      }
      // const aux = Math.trunc(aksdfh/this.groupsNumber)
      const gid = (tindx + gidOffset) % this.groupsNumber;
      if (!sorted[gid]) sorted[gid] = [];

      sorted[gid].push(t);
      auxCounter++
    })
    // los grupos de mayor numeros deben ir primero
    sorted.sort((a: RankItem[], b: RankItem[]) => b.length - a.length)
    return sorted.map(ris => ris.map(ri => ri.team))
  }


  private teamsDraw(teams: RankItem[]): Team[][] {
    let sorted: RankItem[][] = [];
    let i = 0; // conteo de la cantidad de intentos para un draw valido
    let isValid = false;
    const bombos = this.createBombosforDraw(teams);
    while (!isValid && i < 1000) { // mientras no encuentre un orden valido y no haya llegado a 1000 intentos
      bombos.forEach((bom: Bombo<RankItem>) => { bom.reset(); })
      sorted = this.selection(bombos);

      isValid = true;
      sorted.forEach((tarr: RankItem[]) => {
        if (!this.drawRulesValidate(tarr)) isValid = false;
      })
      i++;
      console.log('i', i)
    }
    // los grupos de mayor numeros deben ir primero
    // sorted.sort((a: RankItem[], b: RankItem[]) => b.length - a.length)
    return sorted.map(ris => ris.map(ri => ri.team))
  }
  // 
  private selection(bombos: Bombo<RankItem>[]): Array<RankItem[]> {
    let out: RankItem[][] = [];
    this.groups.forEach(() => { out.push([]) });
    let gid = 0;
    bombos.forEach((b: Bombo<RankItem>) => {
      while (b.state !== 'finished') {
        const elem = b.getNextElement();
        out[gid].push(elem);
        gid = (gid + 1) % this.groupsNumber;
      }
    })

    // this.groups.forEach(() => {
    //   let groupTeams: RankItem[] = [];
    //   bombos.forEach((b: Bombo<RankItem>) => {
    //     const elems = b.getNextElements();
    //     elems.forEach((ri: RankItem) => { groupTeams.push(ri); })
    //   })
    //   out.push(groupTeams);
    // })
    return out;
  }

  /**
   * por ejemplo
   * 1 - no pueden haber n teams que vengan de un mismo grupo anterior
   * 2 - no pueden haber n teams que sean de la misma feder, confed, etc.
   * 3 - no pueden haber n teams de cierta caracteristica
   */
  drawRulesValidate(teams: RankItem[]): boolean {
    let out: boolean = true;

    this.config.drawRulesValidate.forEach((rule: TypeDrawRulePlayoff) => {
      if (rule.origin == 'all') {
        const setOfOrigins = new Set<string>(teams.map(ri => ri.originId));
        out = out && (teams.length - setOfOrigins.size <= rule.minCount);
      } else {
        let count = 0;
        teams.forEach(ri => count += ri.originId == rule.origin ? 1 : 0);
        out = out && (count < rule.minCount)
      }
    })
    return out;
  }

  /**
   * 
   */
  getTable(ttms: TypeTableMatchState): TeamTableItem[] {
    let out: TeamTableItem[] = []; // pasar a map

    this.groups.forEach((g: League) => {
      out = out.concat(g.getTable(ttms));
    })

    out.sort((a, b) => simpleSortFunc(a, b, false)) // usar la media de puntos

    return out;
  }

  getTableOfGroups(ttms: TypeTableMatchState): Array<TeamTableItem[]> {
    let out: Array<TeamTableItem[]> = [];
    this.groups.forEach((g: League) => {
      out.push(g.getTable(ttms));
    })

    return out;
  }
}