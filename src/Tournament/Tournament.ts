import JCalendar from "../JCalendar/JCalendar";
import { IElementInfo, IPhaseConfig, IStageConfig, ITournamentConfig, TCC } from "../JSportModule";
import { Ranking, TypeRanking } from "../JSportModule/data/Ranking/Ranking";
import Phase from "./Phase";
import { TGS } from "./types";

export default class Tournament extends TCC<IElementInfo, ITournamentConfig> {

  private _phases: Phase[] = [];

  constructor(info: IElementInfo, config: ITournamentConfig, cal: JCalendar) {
    super(info, config);
    /**
    * creacion de las phases
    */
    let previusPhasesAgregate: IPhaseConfig[] = []
    config.phases.forEach((ipc: IPhaseConfig, i: number) => {
      ipc.n = i + 1;
      const ipi: IElementInfo = {
        id: `${info.id}_p${ipc.n}`,
        season: info.season,
      }
      let previusPhasesConfigArr = [...previusPhasesAgregate];
      // const previusPhaseConfig = i >= 1 ? config.phases[i - 1] : undefined;
      const phase = new Phase(ipi, ipc, cal, previusPhasesConfigArr);
      this._phases.push(phase);

      previusPhasesAgregate.push(config.phases[i]);
      if (i !== 0) {
        phase.previusPhase = this._phases[i - 1];
      }
    })

    // borrar console.logs
    // if (this.info.id == 'd2i_f014_1988') {
    //   console.log('phase 1')
    //   const mrankphase01 = getGenericRankItemsSortedForPhase01(this._phases[0].config);
    //   console.log(mrankphase01)
    //   console.log('phase 2')

    //   const mrankphase02 = getGenericRankItemsSortedForPhaseN(config.phases[1], config.phases.slice(0, 0))
    //   console.log(getGenericRankItemsSortedForPhase01(this._phases[1].config))
    //   console.log('esto', mrankphase02)
    //   console.log('stages p2')
    //   this._phases[1].stages.forEach((s) => {
    //     console.log(getStageSOURCEItems(s.config))
    //     getStageSOURCEItems(s.config).forEach((value) => {
    //       console.log('SOURCE',
    //         value,
    //         getGenericRankItemsSortedForPhase01(this._phases[0].config).indexOf(value),
    //       )
    //     })
    //   })
    //   console.log('phase 3')
    //   const mrankphase03 = getGenericRankItemsSortedForPhaseN(config.phases[2], config.phases.slice(0, 1));
    //   console.log(mrankphase03)
    //   console.log('esto', getGenericRankItemsSortedForPhaseN(config.phases[2], config.phases.slice(0, 1)))
    //   console.log('stages p3')
    //   this._phases[2].stages.forEach((s) => {
    //     console.log(getStageSOURCEItems(s.config))
    //     getStageSOURCEItems(s.config).forEach((value) => {
    //       console.log('SOURCE',
    //         value,
    //         getGenericRankItemsSortedForPhase01(this._phases[1].config).indexOf(value)
    //       )
    //     })
    //   })
    //   // throw new Error('stop')
    // }

    // verifico el tamaño de las fuentes de las stages dentro del tournment
    // const stages: IStageConfig[] = [];
    // config.phases.forEach(p => stages.push(...p.stages));
    // stages.forEach((st: IStageConfig, _, arr: IStageConfig[]) => {
    //   st.qualifyConditions.forEach((tq) => {
    //     const sourceStage = arr.find(e => tq.rankId.slice(3, 80) == e.idConfig);
    //     if (sourceStage) { // esta dentro del tournament
    //       if (tq.maxRankPos > getStageFinalItems(sourceStage).length) {
    //         throw new Error(`
    //       La stage ${st.idConfig} necesita que hayan al menos ${tq.maxRankPos} elementos en su source: ${sourceStage.idConfig}.
    //       En la stage ${sourceStage.idConfig} solo genera/participan ${getStageFinalItems(sourceStage).length} en total.`)
    //       }
    //     }
    //   })
    // })


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

  get stagesMap() {
    let out: Map<string, TGS> = new Map<string, TGS>()
    this._phases.forEach((phase: Phase) => {
      phase.stages.forEach((stage: TGS) => {
        out.set(stage.config.idConfig, stage)
      })
    })
    return out;
  }
  get phases() { return this._phases }

  getRelativeRank(): Ranking {
    // let rankItemOut: RankItem[] = [];

    let phaseRank: Ranking = Ranking.fromTypeRanking({context: 'none', items: [], teams: []});

    let pi = this._phases.length;
    while (pi >= 0 && phaseRank.context == 'none') {
      pi--;
      if (this._phases[pi].isFinished) {
        phaseRank = this._phases[pi].getRelativeRank();
      }
    }
    // console.log('pi',pi++)

    // phaseRank.table.forEach((ri: RankItem, i: number) => {
    //   rankItemOut.push({
    //     originId: ri.originId,
    //     team: ri.team,
    //     rank: i + 1,
    //   })
    // })

    return Ranking.fromTypeRanking({
      ...phaseRank.getInterface(),
      context: 'tr_' + this.config.idConfig,
    });
  }

}

