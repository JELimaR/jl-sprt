import { JCalendar, TypeHalfWeekOfYear } from "jl-calendar";
import { IElementInfo, IPhaseConfig, IStageConfig, IStageGroupConfig, IStagePlayoffConfig, TCC } from "../JSportModule";
import { IGenericRankItem } from "../JSportModule";
import { Ranking, TypeRanking } from "../JSportModule";
import Team from "../JSportModule/data/Team";
import { AnySportProfile } from "../JSportModule/profiles/ISportProfile";
import { SimulationContext } from "./SimulationContext";
import StageGroup from "./Stage/StageGroup/StageGroup";
import StagePlayoff from "./Stage/StagePlayoff/StagePlayoff";
import { TGS } from "./Stage/Stage";

export default class Phase extends TCC<IElementInfo, IPhaseConfig> { // esto es SortedStagesPhase

  private _parallelStages: TGS[] = [];
  private _ctx: SimulationContext;

  constructor(info: IElementInfo, config: IPhaseConfig, ctx: SimulationContext, sportProfile: AnySportProfile) {
    super(info, config)
    this._ctx = ctx;
    config.stages.forEach((stageConfig: IStageConfig, i: number) => {
      const stage = createStage({ id: `${info.id}_s${i + 1}`, season: info.season }, stageConfig, ctx, sportProfile);
      this._parallelStages.push(stage);
    })
  }

  get stages(): TGS[] { return this._parallelStages }

  get isFinished(): boolean {
    return this._parallelStages.every((s: TGS) => s.isFinished);
  }

  getRelativeRank(): Ranking {
    // El rankItemList concatena los rank groups de todas las stages de la fase, en
    // orden de prioridad (p. ej. [finalistas, perd_semi, perd_cuartos, ..., ramas
    // arrastradas]). Cada item trae su `pos` RELATIVO a su rank group de origen, así
    // que al concatenar ramas distintas los `pos` se repetirían (dos "1", dos "2"...).
    // Acá se RE-NUMERA a una posición GLOBAL 1..N según el orden de concatenación, que
    // ya refleja la jerarquía. Se conserva el `origin` como procedencia.
    const items: IGenericRankItem[] = [];
    const teams: Team[] = [];

    this.config.rankItemList.forEach((item: IGenericRankItem, idx: number) => {
      const sourceRanking = this._ctx.store.get(item.origin);
      if (!sourceRanking) {
        console.log(this._ctx.store.keys())
        console.log(item.origin)
        throw new Error(`No hay sourceRanking
        En Phase.getRelativeRank`);
      }

      const team = sourceRanking.getFromPosition(item.pos).team;
      teams.push(team);
      // pos global 1..N (no el pos relativo del rank group de origen)
      items.push({ origin: item.origin, pos: idx + 1 });
    })

    return Ranking.fromTypeRanking({
      context: 'pr_' + this.config.idConfig,
      items,
      teams,
      metadata: {
        season: this.info.season,
        generatedBy: 'phase',
        sourceId: this.config.idConfig,
      },
    });
  }
}


function createStage(info: IElementInfo, config: IStageConfig, ctx: SimulationContext, sportProfile: AnySportProfile): TGS {
  if (config.type == 'group') {
    const sconfig = config as IStageGroupConfig;
    return new StageGroup(info, sconfig, ctx, sportProfile);
  } else if (config.type == 'playoff') {
    const sconfig = config as IStagePlayoffConfig;
    return new StagePlayoff(info, sconfig, ctx, sportProfile);
  } else {
    throw new Error(`not implemented. (en StageConstructor)`)
  }
}