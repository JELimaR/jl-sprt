import JCalendar from "../JCalendar/JCalendar";
import { TypeHalfWeekOfYear } from "../JCalendar/JDateTimeModule";
import { ITCCConfig, ITCCInfo, TCC } from "../patterns/templateConfigCreator";
import Phase, { IPhaseConfig, IPhaseInfo, stageMapRankForPhase01, stageMapRankForPhaseN, stageSOURCEs } from "./Phase";
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
      const previusPhaseConfig = i >= 1 ? config.phases[i - 1] : undefined;
      const phase = new Phase(ipi, ipc, cal, previusPhaseConfig);
      if (i !== 0) phase.previusPhase = this._phases[i - 1];
      // this._phases.set(phase.info.id, phase);
      this._phases.push(phase);
      // phasesArrAux.push(phase.config)
    })

    if (this.info.id == 'd2i_f014_1988') {
      console.log('phase 1')
      const mrankphase01 = stageMapRankForPhase01(this._phases[0].config);
      console.log(mrankphase01)
      console.log('phase 2')

      const mrankphase02 = stageMapRankForPhaseN(this._phases[1].config, mrankphase01)
      console.log(stageMapRankForPhase01(this._phases[1].config))
      console.log('esto', mrankphase02)
      console.log('stages p2')
      this._phases[1].stages.forEach((s) => {
        console.log(stageSOURCEs(s.config))
        stageSOURCEs(s.config).forEach((value) => {
          console.log('SOURCE',
            value,
            stageMapRankForPhase01(this._phases[0].config).indexOf(value),
          )
        })
      })
      console.log('phase 3')
      const mrankphase03 = stageMapRankForPhaseN(this._phases[2].config, mrankphase02);
      console.log(mrankphase03)
      console.log('esto', stageMapRankForPhaseN(this._phases[2].config, stageMapRankForPhaseN(this._phases[1].config, stageMapRankForPhase01(this._phases[0].config))))
      console.log('stages p3')
      this._phases[2].stages.forEach((s) => {
        console.log(stageSOURCEs(s.config))
        stageSOURCEs(s.config).forEach((value) => {
          console.log('SOURCE',
            value,
            stageMapRankForPhase01(this._phases[1].config).indexOf(value)
          )
        })
      })

      throw new Error('stop')
    }



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

}

