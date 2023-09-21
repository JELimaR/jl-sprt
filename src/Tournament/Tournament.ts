
import JCalendar from "../JCalendar/JCalendar";
import { TypeHalfWeekOfYear } from "../JCalendar/JDateTimeModule";
import { ITCCConfig, ITCCInfo, TCC } from "../patterns/templateConfigCreator";
import { IStageConfig, IStageInfo } from "./Stage/Stage";
import StageGroup, { IStageGroupConfig } from "./Stage/StageGroup/StageGroup";
import StagePlayoff, { IStagePlayoffConfig } from "./Stage/StagePlayoff/StagePlayoff";
import { TGS } from "./types";


export interface ITournamentConfig extends ITCCConfig {
  phases?: IPhaseInfo[];
  stages: { phase: number, config: IStageConfig }[];

  halfWeekOfStartDate: TypeHalfWeekOfYear;
  halfWeekOfEndDate: TypeHalfWeekOfYear;
}
export interface ITournamentInfo extends ITCCInfo {
  season: number;
}

export default class Tournament extends TCC<ITournamentInfo, ITournamentConfig> {

  private _stages: Map<string, TGS> = new Map<string, TGS>();
  private _phases: Map<string, Phase> = new Map<string, Phase>();

  constructor(info: ITournamentInfo, config: ITournamentConfig, cal: JCalendar) {
    super(info, config);

    const phasesArrAux: Phase[] = [];

    /**
     * creacion de las stages y agregado a las phases
     * creacion de las phases y agregado de las stages
     * calculo de las halfWeekOfStartDate y halfWeekOfEndDate del tournament
     */
    let halfWeekOfStartDate: TypeHalfWeekOfYear = 108;
    let halfWeekOfEndDate: TypeHalfWeekOfYear = 1;
    config.stages.forEach((sconfig, i: number) => {
      const stage: TGS = Tournament.create({ id: `${info.id}_s${i + 1}`, season: info.season }, sconfig.config, cal);
      this._stages.set(stage.info.id, stage);
      halfWeekOfStartDate = Math.min(halfWeekOfStartDate, stage.config.halfWeekOfStartDate) as TypeHalfWeekOfYear;
      halfWeekOfEndDate = Math.max(halfWeekOfEndDate, stage.config.halfWeekOfEndDate) as TypeHalfWeekOfYear;
      // agregar el stage a la phase correspondiente
      const phaseId = `${info.id}_ph${sconfig.phase}`;
      let phase = this._phases.get(phaseId);
      if (!phase) {
        phase = new Phase(phaseId)
        this._phases.set(phaseId, phase);
        phasesArrAux.push(phase);
      }
      phase.addStage(stage);
      stage.getRelativeRank()
    })
    this.config.halfWeekOfStartDate = halfWeekOfStartDate;
    this.config.halfWeekOfEndDate = halfWeekOfEndDate;

    // verificar el inicio y fin de las phases luego que se puede determinar sus halfWeekOfStartDate y halfWeekOfEndDate
    phasesArrAux.sort((a, b) => (a.id < b.id ? -1 : 1));
    for (let i = 1; i < phasesArrAux.length; i++) {
      const prevP = phasesArrAux[i - 1];
      const nextP = phasesArrAux[i]
      if (prevP.halfWeekOfEndDate >= nextP.halfWeekOfStartDate) {
        throw new Error(`la phase ${prevP.id} termina despues (hw = ${prevP.halfWeekOfEndDate})
        de que la phase ${nextP.id} comienza (hw = ${nextP.halfWeekOfStartDate}).
        (Tournament.constructor)`)
      }
    }
  }

  get stages() { return this._stages }
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

interface IPhaseInfo {
  stagesConfig: IStageConfig[];
  id: string;
  start: TypeHalfWeekOfYear;
  end: TypeHalfWeekOfYear;
}
// independizar de las clases stage
class Phase {

  private _id: string;
  private _parallelStages: { stage: TGS }[] = [];
  private _dependencies: any;

  constructor(id: string) {
    this._id = id;
  }

  get id() { return this._id }

  addStage(stage: TGS) {
    this._parallelStages.push({ stage })
  }

  get halfWeekOfStartDate(): TypeHalfWeekOfYear {
    let out: TypeHalfWeekOfYear = 108;
    this._parallelStages.forEach(value => {
      out = Math.min(out, value.stage.config.halfWeekOfStartDate) as TypeHalfWeekOfYear;
    })
    return out;
  }
  get halfWeekOfEndDate(): TypeHalfWeekOfYear {
    let out: TypeHalfWeekOfYear = 1;
    this._parallelStages.forEach(value => {
      out = Math.max(out, value.stage.config.halfWeekOfEndDate) as TypeHalfWeekOfYear;
    })
    return out;
  }

  // lista de los ranksIds que genera la phase
  ranksToGenerate() {
    let out: string[] = [];

    this._parallelStages.forEach(({stage}) => {
      out.push(`sr_${stage.config.idConfig}`)
    })

    return out;
  }

  getDependencyIds(): string[] {
    let out: string[] = [];

    this._parallelStages.forEach(({stage}) => {
      stage.config.qualifyConditions.forEach(tq => {
        out.push(tq.rankId);
      })
    })

    return out;
  }

}