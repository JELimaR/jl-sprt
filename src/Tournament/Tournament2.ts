import JCalendar from "../JCalendar/JCalendar";
import { TypeHalfWeekOfYear } from "../JCalendar/JDateTimeModule";
import { ITCCConfig, ITCCInfo, TCC } from "../patterns/templateConfigCreator";
import { RankItem, TypeRanking } from "./Rank/ranking";
import { IStageConfig } from "./Stage/Stage";
import StageGroup, { IStageGroupConfig } from "./Stage/StageGroup/StageGroup";
import StagePlayoff, { IStagePlayoffConfig } from "./Stage/StagePlayoff/StagePlayoff";
import { IElementInfo, TGS } from "./types";


export interface ITournamentConfig extends ITCCConfig {
  phases: IPhaseConfig[];

  hwStart: TypeHalfWeekOfYear;
  hwEnd: TypeHalfWeekOfYear;
}

export default class Tournament extends TCC<IElementInfo, ITournamentConfig> {

  // private _stages: Map<string, TGS> = new Map<string, TGS>();
  // private _phases: Map<string, Phase> = new Map<string, Phase>();
  private _phases: Phase[] = [];

  constructor(info: IElementInfo, config: ITournamentConfig, cal: JCalendar) {
    super(info, config);
    // const phasesArrAux: IPhaseConfig[] = [];

     /**
     * creacion de las phases
     */
    config.phases.forEach((ipc: IPhaseConfig, i: number) => {
      ipc.n = i + 1;
      const ipi: IPhaseInfo = {
        id: `${info.id}_p${ipc.n}`,
        season: info.season,
      }
      const phase = new Phase(ipi, ipc, cal);
      // this._phases.set(phase.info.id, phase);
      this._phases.push(phase);
      // phasesArrAux.push(phase.config)
    })


   
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
    config.phases.forEach((ipc: IPhaseConfig) => {
      if (ipc.hwStart < config.hwStart) {
        throw new Error(`La phase ${ipc.idConfig} comienza antes (${ipc.hwStart})
        que el tournament: ${config.idConfig} comience (${config.hwStart})`)
      }
      if (ipc.hwEnd > config.hwEnd) {
        throw new Error(`La phase ${ipc.idConfig} termina luego (${ipc.hwEnd})
        que el tournament: ${config.idConfig} termine (${config.hwEnd})`)
      }
    })

    for (let i = 1; i < config.phases.length; i++) {
      const prevP = config.phases[i - 1];
      const nextP = config.phases[i]
      if (prevP.hwEnd >= nextP.hwStart) {
        throw new Error(`la phase ${prevP.n} termina despues (hw = ${prevP.hwEnd})
        de que la phase ${nextP.n} comienze (hw = ${nextP.hwStart}).
        (Tournament.constructor)`)
      }
    }
  }

  // get stages() { return this._stages }
  get phases() { return this._phases }

  // falta ver como verificar con el config que es correcto
  getRelativeRank(): TypeRanking {
    let rankItemOut: RankItem[] = [];
    for (let i = this._phases.length - 1; i >= 0; i--) {
      const phase = this._phases[i];
      phase.getRelativeRank().table.forEach((ri: RankItem) => {
        if (!rankItemOut[ri.rank - 1]) {
          rankItemOut[ri.rank - 1] = ri;
        }
      })
    }

    return {
      rankId: 'tr_' + this.config.idConfig,
      table: rankItemOut
    }

  }

  static create(info: IElementInfo, config: IStageConfig, cal: JCalendar): TGS {
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

  hwStart: TypeHalfWeekOfYear;
  hwEnd: TypeHalfWeekOfYear;
}

interface IPhaseInfo extends ITCCInfo {
  season: number;
}

class Phase extends TCC<IPhaseInfo, IPhaseConfig> {

  private _parallelStages: { minRankPos: number, stage: TGS }[] = [];

  constructor(info: IPhaseInfo, config: IPhaseConfig, cal: JCalendar) {
    super(info, config)

    /************************************************************************************************************************************************
     * VERIFICACIONES
     */
    config.stages.forEach((value: { minRankPos: number; config: IStageConfig; }) => {
      if (value.config.hwStart < config.hwStart) {
        throw new Error(`La stage ${value.config.idConfig} comienza antes (${value.config.hwStart})
        que la phase: ${config.idConfig} comienza (${value.config.hwStart})`)
      }
      if (value.config.hwEnd > config.hwEnd) {
        throw new Error(`La stage ${value.config.idConfig} termina despues (${value.config.hwEnd})
        que que la phase: ${config.idConfig} termina (${config.hwEnd})`)
      }
    })

    /************************************************************************************************************************************************/
    config.stages.forEach((value: { minRankPos: number; config: IStageConfig; }, i: number) => {
      const stage = createStage({ id: `${info.id}_s${i + 1}`, season: info.season }, value.config, cal);
      this._parallelStages.push({ minRankPos: value.minRankPos, stage });
    })
  }

  get stages(): TGS[] { return this._parallelStages.map(v => v.stage) }

  // faltan muchas cosas
  getRelativeRank(): TypeRanking {
    let rankItemOut: RankItem[] = [];
    this._parallelStages.forEach(({ minRankPos, stage }) => {
      const sr_rank = stage.getRelativeRank();
      sr_rank.table.forEach((ri: RankItem) => {
        rankItemOut.push({
          originId: sr_rank.rankId,
          team: ri.team,
          rank: ri.rank + minRankPos - 1,
        })
      })
    })

    rankItemOut.sort((a, b) => {
      if (a.rank === b.rank)
        throw new Error(`a.rank ${a.rank} y b.rank ${b.rank} no pueden ser iguales. (Phase.getRelativeRank)`)
      return a.rank - b.rank
    });

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
      out = Math.min(out, value.config.hwStart) as TypeHalfWeekOfYear;
    })
    return out;
  }
  static calcHalfWeekOfEndDate(phaseConfig: IPhaseConfig): TypeHalfWeekOfYear {
    let out: TypeHalfWeekOfYear = 1;
    phaseConfig.stages.forEach(value => {
      out = Math.max(out, value.config.hwEnd) as TypeHalfWeekOfYear;
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