import JCalendar from "../JCalendar/JCalendar";
import { TypeHalfWeekOfYear } from "../JCalendar/JDateTimeModule";
import { IElementInfo, IPhaseConfig, IStageConfig, IStageGroupConfig, IStagePlayoffConfig, TCC } from "../JSportModule";
import { IGenericRankItem } from "../JSportModule";
import { Ranking, TypeRanking } from "../JSportModule";
import { globalFinishedRankingsMap } from "./Rank/globalFinishedRankingsMap";
import StageGroup from "./Stage/StageGroup/StageGroup";
import StagePlayoff from "./Stage/StagePlayoff/StagePlayoff";
import { TGS } from "./types";

export default class Phase extends TCC<IElementInfo, IPhaseConfig> { // esto es SortedStagesPhase

  private _parallelStages: TGS[] = [];
  private _previusPhaseConfigsArr: IPhaseConfig[];;

  private _previusPhase: Phase | undefined;

  constructor(info: IElementInfo, config: IPhaseConfig, cal: JCalendar, previusPhaseConfig: IPhaseConfig[]) {
    super(info, config)

    /************************************************************************************************************************************************
     * VERIFICACIONES
     */
    config.stages.forEach((stageConfig: IStageConfig) => {
      if (stageConfig.hwStart < config.hwStart) {
        throw new Error(`La stage ${stageConfig.idConfig} comienza antes (${stageConfig.hwStart})
        que la phase: ${config.idConfig} comienza (${stageConfig.hwStart})`)
      }
      if (stageConfig.hwEnd > config.hwEnd) {
        throw new Error(`La stage ${stageConfig.idConfig} termina despues (${stageConfig.hwEnd})
        que que la phase: ${config.idConfig} termina (${config.hwEnd})`)
      }
    })
    // las stages de la phase no pueden depender de otras stages de la phase
    // por tanto, en las ranksToGenerateIds no pueden haber elementos de sourcesIds
    // HACER ESTA VERIFICACION EN TOURNAMENT Y LUEGO MÁS ARRIBA
    const ranksToGenerateIds = Phase.getRanksToGenerateIds(config.stages);
    const sourcesIds = Phase.getSourceIds(config.stages);
    const duplicates = sourcesIds.filter((rd: string) => ranksToGenerateIds.includes(rd));
    if (duplicates.length > 0) {
      throw new Error(`
        Dentro de la Phase ${info.id}, existen dependencias internas entre las stages: ${duplicates.toString()}
      `)
    }

    // verificar que no se "crucen las dependencias" (S21 dep de S12 y S22 dep de S11)

    /************************************************************************************************************************************************/
    config.stages.forEach((stageConfig: IStageConfig, i: number) => {
      const stage = createStage({ id: `${info.id}_s${i + 1}`, season: info.season }, stageConfig, cal);
      this._parallelStages.push(stage);
    })
    this._previusPhaseConfigsArr = previusPhaseConfig;
  }

  get stages(): TGS[] { return this._parallelStages }
  set previusPhase(pp: Phase) { this._previusPhase = pp }
  get isFinished(): boolean {
    return this._parallelStages.every((s: TGS) => s.isFinished);
  }

  getRelativeRank(): Ranking {
    let out: TypeRanking = {
      context: 'pr_' + this.config.idConfig,
      items: this.config.rankItemList,
      teams: [],
    };

    this.config.rankItemList.forEach((item: IGenericRankItem, idx: number) => {
      // console.log(item);

      const sourceRanking = globalFinishedRankingsMap.get(item.origin);
      if (!sourceRanking) {
        console.log(globalFinishedRankingsMap.keys())
        console.log(item.origin)
        throw new Error(`No hay sourceRanking
        En Phase.getRelativeRank`);
      }
      
      const team = sourceRanking.getFromPosition(item.pos).team;
      out.teams.push(team);
    })
    
    return Ranking.fromTypeRanking(out);
  }

  static calcHalfWeekOfStartDate(phaseConfig: IPhaseConfig): TypeHalfWeekOfYear { // mover a verification module
    let out: TypeHalfWeekOfYear = 108;
    phaseConfig.stages.forEach(value => {
      out = Math.min(out, value.hwStart) as TypeHalfWeekOfYear;
    })
    return out;
  }
  static calcHalfWeekOfEndDate(phaseConfig: IPhaseConfig): TypeHalfWeekOfYear { // mover a verification module
    let out: TypeHalfWeekOfYear = 1;
    phaseConfig.stages.forEach(value => {
      out = Math.max(out, value.hwEnd) as TypeHalfWeekOfYear;
    })
    return out;
  }

  // lista de los ranksIds que genera la phase - se puede reubicar
  static getRanksToGenerateIds(stages: IStageConfig[]): string[] {
    let out: string[] = [];

    stages.forEach((config) => {
      out.push(`sr_${config.idConfig}`) // OJO
    })

    return out;
  }

  static getSourceIds(stages: IStageConfig[]): string[] {
    let out: string[] = [];

    stages.forEach((config) => {
      config.qualifyConditions.forEach(tq => {
        out.push(tq.rankId);
      })
    })
    
    const conjunto = new Set(out);
    if (conjunto.size !== out.length) {
      console.log(out)
      console.log(conjunto)
      throw new Error(`Los elementos del source de la stage no pueden repetirse`)
    }

    return out;
  }

}


function createStage(info: IElementInfo, config: IStageConfig, cal: JCalendar): TGS {
  if (config.type == 'group') {
    const sconfig = config as IStageGroupConfig;
    return new StageGroup(info, sconfig, cal);
  } else if (config.type == 'playoff') {
    const sconfig = config as IStagePlayoffConfig;
    return new StagePlayoff(info, sconfig, cal);
  } else {
    throw new Error(`not implemented. (en StageConstructor)`)
  }
}