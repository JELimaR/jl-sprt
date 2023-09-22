import JCalendar from "../JCalendar/JCalendar";
import { TypeHalfWeekOfYear } from "../JCalendar/JDateTimeModule";
import { ITCCConfig, ITCCInfo, TCC } from "../patterns/templateConfigCreator";
import { TypeRanking, RankItem } from "./Rank/ranking";
import { IStageConfig } from "./Stage/Stage";
import StageGroup, { IStageGroupConfig } from "./Stage/StageGroup/StageGroup";
import StagePlayoff, { IStagePlayoffConfig } from "./Stage/StagePlayoff/StagePlayoff";
import { TGS, IElementInfo } from "./types";

export interface IPhaseConfig extends ITCCConfig {
  n: number;
  stages: { minRankPos: number, config: IStageConfig }[];

  hwStart: TypeHalfWeekOfYear;
  hwEnd: TypeHalfWeekOfYear;
}

export interface IPhaseInfo extends ITCCInfo {
  season: number;
}

export default class Phase extends TCC<IPhaseInfo, IPhaseConfig> { // esto es SortedStagesPhase

  private _parallelStages: { minRankPos: number, stage: TGS }[] = [];// TGS[] = [];
  private _previusPhaseConfig: IPhaseConfig | undefined;

  private _previusPhase: Phase | undefined;

  constructor(info: IPhaseInfo, config: IPhaseConfig, cal: JCalendar, previusPhaseConfig: IPhaseConfig | undefined) {
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
    // las stages de la phase no pueden depender de otras stages de la phase
    // por tanto, en las ranksToGenerate no pueden haber elementos de ranksDependencies
    // HACER ESTA VERIFICACION EN TOURNAMENT Y LUEGO MÁS ARRIBA
    const ranksToGenerate = Phase.getRanksToGenerateList(config.stages);
    const ranksDependencies = Phase.getRankDependenciesList(config.stages);
    const duplicates = ranksDependencies.filter((rd: string) => ranksToGenerate.includes(rd));
    if (duplicates.length > 0) {
      throw new Error(`
        Dentro de la Phase ${info.id}, existen dependencias internas entre las stages: ${duplicates.toString()}
      `)
    }

    /************************************************************************************************************************************************/
    config.stages.forEach((value: { minRankPos: number; config: IStageConfig; }, i: number) => {
      const stage = createStage({ id: `${info.id}_s${i + 1}`, season: info.season }, value.config, cal);
      this._parallelStages.push({ minRankPos: value.minRankPos, stage });
    })
    this._previusPhaseConfig = previusPhaseConfig;
  }

  get stages(): TGS[] { return this._parallelStages.map(v => v.stage) }
  set previusPhase(pp: Phase) { this._previusPhase = pp }


  // faltan muchas cosas
  // en la phase, si estan en orden, se mantiene el orden en el rank, de lo contrario se combinan
  getRelativeRank(): TypeRanking {
    let rankItemOut: RankItem[] = [];

    let currRank = 1;
    this._parallelStages.forEach(({ minRankPos, stage }) => {
      const sr_rank = stage.getRelativeRank();
      sr_rank.table.forEach((ri: RankItem, i: number) => {
        rankItemOut.push({
          originId: sr_rank.rankId,
          team: ri.team,
          rank: currRank++//ri.rank + minRankPos - 1,
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
  static getRanksToGenerateList(stages: { minRankPos: number, config: IStageConfig }[]): string[] {
    let out: string[] = [];

    stages.forEach(({ config }) => {
      out.push(`sr_${config.idConfig}`) // OJO
    })

    return out;
  }

  static getRankDependenciesList(stages: { minRankPos: number, config: IStageConfig }[]): string[] {
    let out: string[] = [];

    stages.forEach(({ config }) => {
      config.qualifyConditions.forEach(tq => {
        out.push(tq.rankId);
      })
    })

    return out;
  }

}
/***************************************************************************************************************************************** */
// lista de los rankitemsid de la phase 1
export function stageMapRankForPhase01(phaseConfig: IPhaseConfig): {s: string, p: number}[] {
  const out: {s: string, p: number}[] = [];
  phaseConfig.stages.forEach(({ config }) => {
    let stageParticipants = 0;
    config.bombos.forEach(b => stageParticipants += b);
    for (let p = 1; p <= stageParticipants; p++) {
      const elemString = {s: `sr_${config.idConfig}`, p}; // OJO
      out.push(elemString);
    }
  })

  return out;
}

// lista de los rankitemsid de la phase n
export function stageMapRankForPhaseN(phaseConfig: IPhaseConfig, previusElems: { s: string, p: number }[]) {
  console.log('--------------stageMapRankForPhaseN---------------------')
  const out: { s: string, p: number }[] = [];
  const ranking_n1 = [...previusElems];

  console.log(`en ranking_n1.`, ranking_n1)
  let p = ranking_n1.shift();
  let s = 0;
  while (!!p) {
    let pp: { s: string, p: number } = {...p};
    const stageConfig = phaseConfig.stages[s]?.config;
    if (!stageConfig) {
      out.push(pp)
    }
    else {
      // phaseConfig.stages.forEach(({ config: stageConfig }) => {
      const SOURCE = stageSOURCEs(stageConfig);
      if (SOURCE.filter(e => e.s == pp.s && e.p == pp.p).length == 1) {
        // buscar el index de pp en ranking_p1
        console.log(pp)
        console.log('SOURCE', stageConfig.idConfig, SOURCE)
        let ppIndx = 0;
        SOURCE.forEach((e, i: number) => {if(e.s == pp.s && e.p == pp.p) ppIndx = i})
        // let indxDif = SOURCE.indexOf(pp) - ranking_n1.indexOf(pp);
        SOURCE.forEach((_, s: number) => {
          console.log('s', s, 'ppIndx', ppIndx)
          if (s > ppIndx) {
            // console.log('p', phaseConfig.idConfig, 's', s, ranking_n1)
            const ppAux = ranking_n1.shift();
            if (!ppAux) throw new Error(`en stageMapRankForPhaseN. ${ranking_n1.length}`)
          }
        })

        out.push(...stageFinalPosistions(stageConfig))

      } else {
        out.push(pp)
      }
      // })
    }
    p = ranking_n1.shift();
    s++;
  }

  return out;
}

export function stageSOURCEs(stageConfig: IStageConfig) {
  const out: { s: string, p: number }[] = [];
  stageConfig.qualifyConditions.forEach(qc => {
    for (let q = qc.minRankPos; q <= qc.maxRankPos; q++) out.push({ s: qc.rankId, p: q });
  })
  return out;
}

export function stageFinalPosistions(stageConfig: IStageConfig) {
  const out: { s: string, p: number }[] = [];
  let stageParticipants = 0;
  stageConfig.bombos.forEach(b => stageParticipants += b);
  for (let p = 1; p <= stageParticipants; p++) {
    const elem = { s: `sr_${stageConfig.idConfig}`, p }; // OJO
    out.push(elem);
  }
  return out;
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