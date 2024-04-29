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

  constructor(info: IElementInfo, config: IPhaseConfig, cal: JCalendar) {
    super(info, config)
    config.stages.forEach((stageConfig: IStageConfig, i: number) => {
      const stage = createStage({ id: `${info.id}_s${i + 1}`, season: info.season }, stageConfig, cal);
      this._parallelStages.push(stage);
    })
  }

  get stages(): TGS[] { return this._parallelStages }

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