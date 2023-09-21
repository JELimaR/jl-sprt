
import JCalendar from "../JCalendar/JCalendar";
import { TypeHalfWeekOfYear } from "../JCalendar/JDateTimeModule";
import { ITCCConfig, ITCCInfo, TCC } from "../patterns/templateConfigCreator";
import { RankItem, TypeRanking } from "./Rank/ranking";
import { IStageConfig, IStageInfo } from "./Stage/Stage";
import StageGroup, { IStageGroupConfig } from "./Stage/StageGroup/StageGroup";
import StagePlayoff, { IStagePlayoffConfig } from "./Stage/StagePlayoff/StagePlayoff";
import { TGS } from "./types";


export interface ITournamentConfig extends ITCCConfig {
  phases: IPhaseConfig[];

  start: TypeHalfWeekOfYear;
  end: TypeHalfWeekOfYear;
}
export interface ITournamentInfo extends ITCCInfo {
  season: number;
}

export default class Tournament extends TCC<ITournamentInfo, ITournamentConfig> {

  // private _stages: Map<string, TGS> = new Map<string, TGS>();
  private _phases: Map<string, Phase> = new Map<string, Phase>();

  constructor(info: ITournamentInfo, config: ITournamentConfig, cal: JCalendar) {
    super(info, config);
    const phasesArrAux: IPhaseConfig[] = [];

    config.phases.forEach((ipc: IPhaseConfig, i: number) => {
      ipc.n = i + 1;
      const ipi: IPhaseInfo = {
        id: `${info.id}_p${ipc.n}`,
        season: info.season,
        // start: Phase.calcHalfWeekOfStartDate(ipc),
        // end: Phase.calcHalfWeekOfEndDate(ipc),
      }
      const phase = new Phase(ipi, ipc, cal);
      this._phases.set(phase.info.id, phase);
      phasesArrAux.push(phase.config)
    })


    /**
     * creacion de las stages y agregado a las phases
     * creacion de las phases y agregado de las stages
     * calculo de las halfWeekOfStartDate y halfWeekOfEndDate del tournament
     */
    // let halfWeekOfStartDate: TypeHalfWeekOfYear = 108;
    // let halfWeekOfEndDate: TypeHalfWeekOfYear = 1;
    // config.stages.forEach((sconfig, i: number) => {
    //   const stage: TGS = Tournament.create({ id: `${info.id}_s${i + 1}`, season: info.season }, sconfig.config, cal);
    //   this._stages.set(stage.info.id, stage);
    //   halfWeekOfStartDate = Math.min(halfWeekOfStartDate, stage.config.halfWeekOfStartDate) as TypeHalfWeekOfYear;
    //   halfWeekOfEndDate = Math.max(halfWeekOfEndDate, stage.config.halfWeekOfEndDate) as TypeHalfWeekOfYear;
    //   // agregar el stage a la phase correspondiente
    //   const phaseId = `${info.id}_ph${sconfig.phase}`;
    //   let phase = this._phases.get(phaseId);
    //   if (!phase) {
    //     phase = new Phase(phaseId)
    //     this._phases.set(phaseId, phase);
    //     phasesArrAux.push(phase);
    //   }
    //   phase.addStage(stage);
    // })
    // this.config.halfWeekOfStartDate = halfWeekOfStartDate;
    // this.config.halfWeekOfEndDate = halfWeekOfEndDate;

    // verificar el inicio y fin de las phases luego que se puede determinar sus halfWeekOfStartDate y halfWeekOfEndDate
    phasesArrAux.sort((a, b) => (a.n < b.n ? -1 : 1));
    for (let i = 1; i < phasesArrAux.length; i++) {
      const prevP = phasesArrAux[i - 1];
      const nextP = phasesArrAux[i]
      if (Phase.calcHalfWeekOfEndDate(prevP) >= Phase.calcHalfWeekOfStartDate(nextP)) {
        throw new Error(`la phase ${prevP.n} termina despues (hw = ${Phase.calcHalfWeekOfEndDate(prevP)})
        de que la phase ${nextP.n} comienza (hw = ${Phase.calcHalfWeekOfStartDate(nextP)}).
        (Tournament.constructor)`)
      }
    }
  }

  // get stages() { return this._stages }
  get phases() { return this._phases }

  static create(info: IStageInfo, config: IStageConfig, cal: JCalendar): TGS {
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

}

interface IPhaseConfig extends ITCCConfig {
  n: number;
  stages: { minRankPos: number, config: IStageConfig }[];

  start: TypeHalfWeekOfYear;
  end: TypeHalfWeekOfYear;
}

interface IPhaseInfo extends ITCCInfo {
  season: number;
}

// independizar de las clases stage
class Phase extends TCC<IPhaseInfo, IPhaseConfig> {

  // private _id: string;
  private _parallelStages: {minRankPos: number, stage: TGS}[] = [];
  // private _dependencies: any;

  constructor(info: IPhaseInfo, config: IPhaseConfig, cal: JCalendar) {
    super(info, config)

    /************************************************************************************************************************************************
     * VERIFICACIONES
     */

    /************************************************************************************************************************************************/
    config.stages.forEach((value: { minRankPos: number; config: IStageConfig; }, i: number) => {
      const stage = createStage({ id: `${info.id}_s${i + 1}`, season: info.season }, value.config, cal);
      this._parallelStages.push({minRankPos: value.minRankPos, stage});
    })
  }

  get stages(): TGS[] { return this._parallelStages.map(v => v.stage) }

  // faltan muchas cosas
  getRelativeRank(): TypeRanking {
    let rankItemOut: RankItem[] = [];
    this._parallelStages.forEach(({minRankPos, stage}) => {
      const sr_rank = stage.getRelativeRank();
      sr_rank.table.forEach((ri: RankItem) => {
        rankItemOut.push({
          originId: sr_rank.rankId,
          team: ri.team,
          rank: ri.rank + minRankPos - 1,
        })
      })
    })

    return {
      rankId: 'pr_' + this.config.idConfig,
      table: rankItemOut,
    }
  }

  // addStage(stage: TGS) {
  //   this._parallelStages.push({ stage })
  // }

  static calcHalfWeekOfStartDate(phaseConfig: IPhaseConfig): TypeHalfWeekOfYear {
    let out: TypeHalfWeekOfYear = 108;
    phaseConfig.stages.forEach(value => {
      out = Math.min(out, value.config.halfWeekOfStartDate) as TypeHalfWeekOfYear;
    })
    return out;
  }
  static calcHalfWeekOfEndDate(phaseConfig: IPhaseConfig): TypeHalfWeekOfYear {
    let out: TypeHalfWeekOfYear = 1;
    phaseConfig.stages.forEach(value => {
      out = Math.max(out, value.config.halfWeekOfEndDate) as TypeHalfWeekOfYear;
    })
    return out;
  }

  // lista de los ranksIds que genera la phase
  // ranksToGenerate() {
  //   let out: string[] = [];

  //   this._parallelStages.forEach(({stage}) => {
  //     out.push(`sr_${stage.config.idConfig}`)
  //   })

  //   return out;
  // }

  // getDependencyIds(): string[] {
  //   let out: string[] = [];

  //   this._parallelStages.forEach(({stage}) => {
  //     stage.config.qualifyConditions.forEach(tq => {
  //       out.push(tq.rankId);
  //     })
  //   })

  //   return out;
  // }

}


function createStage(info: IStageInfo, config: IStageConfig, cal: JCalendar): TGS {
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