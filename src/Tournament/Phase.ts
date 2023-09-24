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
  stages: IStageConfig[];

  hwStart: TypeHalfWeekOfYear;
  hwEnd: TypeHalfWeekOfYear;
}

export interface IPhaseInfo extends ITCCInfo {
  season: number;
}

export default class Phase extends TCC<IPhaseInfo, IPhaseConfig> { // esto es SortedStagesPhase

  private _parallelStages: /*{ minRankPos: number, stage: TGS }[] = [];// */TGS[] = [];
  private _previusPhaseConfigsArr: IPhaseConfig[];;

  private _previusPhase: Phase | undefined;

  constructor(info: IPhaseInfo, config: IPhaseConfig, cal: JCalendar, previusPhaseConfig: IPhaseConfig[]) {
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
    // por tanto, en las ranksToGenerate no pueden haber elementos de ranksDependencies
    // HACER ESTA VERIFICACION EN TOURNAMENT Y LUEGO MÁS ARRIBA
    const ranksToGenerate = Phase.getRanksToGenerateList(config.stages);
    const ranksDependencies = Phase.getRankDependenciesList(config.stages);
    const duplicates = ranksDependencies.filter((rd: string) => ranksToGenerate.includes(rd));
    if (duplicates.length > 0) {
      throw new Error(`
        Dentro de la Phase ${info.id}, eexistenxisten dependencias internas entre las stages: ${duplicates.toString()}
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


  // faltan muchas cosas
  // en la phase, si estan en orden, se mantiene el orden en el rank, de lo contrario se combinan
  getRelativeRank(): TypeRanking {
    let rankItemOut: RankItem[] = [];
    let relRankData = stageMapRankForPhaseN(this.config, this._previusPhaseConfigsArr);
    throw new Error(`Falta terminar Phase.getRelativeRank`)

    // for (let i = 1; i < this._phases.length; i++) {
    //   const phase = this._phases[i];
    //   relRankData = stageMapRankForPhaseN(phase.config, this._phases.slice(0,i-1).map(e => e.config))
    // }

    const stagesMap = this.stages;
    relRankData.forEach((elem, i) => {
      const stageRank = stagesMap.filter(s => s.config.idConfig == elem.s.slice(3,80) )[0].getRelativeRank();
      if (!stageRank) throw new Error(`En Tournament.getRelativeRank`)
      rankItemOut.push({
        originId: elem.s,
        team: stageRank.table[elem.p-1].team,
        rank: i+1,
      })
    })

    return {
      rankId: 'tr_' + this.config.idConfig,
      table: rankItemOut
    }
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
  static getRanksToGenerateList(stages: IStageConfig[]): string[] {
    let out: string[] = [];

    stages.forEach((config) => {
      out.push(`sr_${config.idConfig}`) // OJO
    })

    return out;
  }

  static getRankDependenciesList(stages: IStageConfig[]): string[] {
    let out: string[] = [];

    stages.forEach((config) => {
      config.qualifyConditions.forEach(tq => {
        out.push(tq.rankId);
      })
    })

    return out;
  }

}
/***************************************************************************************************************************************** */
// lista de los rankitemsid de la phase 1
export function stageMapRankForPhase01(phaseConfig: IPhaseConfig): { s: string, p: number }[] {
  const out: { s: string, p: number }[] = [];
  phaseConfig.stages.forEach((config) => {
    let stageParticipants = 0;
    config.bombos.forEach(b => stageParticipants += b);
    for (let p = 1; p <= stageParticipants; p++) {
      const elemString = { s: `sr_${config.idConfig}`, p }; // OJO
      out.push(elemString);
    }
  })

  return out;
}

// lista de los rankitemsid de la phase n
/**
 * Sea p el siguiente elemento de prevGenericRankList
 * Sea s el siguiente stage no considerado aún
 * mientras exista p {
 * p no debe estar en ninguno de los prev_s
 * 
 * hay que verificar si p va directo o indirectamente a traves de s.
 * si va directo, puede ir arriba o debajo
 *  va arriba solo si hay elementos de prevGenericRankList no considerados que estan dentro de algun SOURCE (s),
 *     debo verificar que no aparezca más adelante, dando lugar a una inconsistencia
 *  en caso contrario va debajo, por lo que se agregan los elementos de s y se deja de conciderar
 * si va indirectamente, hay que verificar su nivel dentro del SOURCE_s - pLevel
 *  a partir de plevel, los elementos de SOURCE_s y los pnext deben coincidir.
 * }
 */
export function stageMapRankForPhaseN(phaseConfig: IPhaseConfig /*prevGenericRankListEntry:IGenericRankItem[]*/, previus: IPhaseConfig[]) {
  // console.log('--------------stageMapRankForPhaseN---------------------')
  const out: IGenericRankItem[] = [];
  if (previus.length == 0) {
    return stageMapRankForPhase01(phaseConfig)
  } 
  const prevGenericRankList = stageMapRankForPhaseN(previus[0], previus.slice(0, previus.length-1))//[...prevGenericRankListEntry];
  const notConsideredStages = [...phaseConfig.stages];

  let pidx = 0;
  // let ppItem: IGenericRankItem = prevGenericRankList_copy[pidx];
  let sidx = 0;
  // let SOURCEcurr = getStageSOURCEItems(notConsideredStages[sidx]);
  while (pidx < prevGenericRankList.length) {
    let ppItem: IGenericRankItem = prevGenericRankList[pidx];
    // p no debe estar en ninguno de los prev_s
    for (let ss = 0; ss < sidx; ss++) {
      // console.log(phaseConfig.idConfig, ss)
      const SOURCEprev = getStageSOURCEItems(phaseConfig.stages[ss]);
      if (getIndexOf(SOURCEprev, ppItem) > -1) {
        console.log('ppItem', ppItem)
        console.log('SOURCEprev', SOURCEprev)
        console.log('out', out)
        throw new Error(`pp aparece en SOURCEprev`)
      }
    }
    // hay que verificar si p va directo o indirectamente a traves de s.
    const stageConfig = phaseConfig.stages[sidx];
    if (!stageConfig) {
      // como no hay otra s, todos van directo
      for (let pp = pidx; pp < prevGenericRankList.length; pp++) {
        out.push(ppItem);
        pidx++;
        ppItem = prevGenericRankList[pidx];
      }
    } else {
      const SOURCEcurr = getStageSOURCEItems(stageConfig);
      // hay que verificar si p va directo o indirectamente a traves de s.
      const ppItem_SourceIndex = getIndexOf(SOURCEcurr, ppItem);
      if (ppItem_SourceIndex == -1) { // ppItem no está en SOURCE, entonces va directo o en el siguiente SOURCE
        //  puede ir arriba o debajo
        // va arriba solo si hay elementos de prevGenericRankList no considerados que estan dentro de algun SOURCE (verificar en s),
        let vaArriba = false;
        for (let pp = pidx + 1; pp < prevGenericRankList.length && !vaArriba; pp++) {
          const ppAux = prevGenericRankList[pp];
          vaArriba = (getIndexOf(SOURCEcurr, ppAux) !== -1);
        }
        if (vaArriba) {
          // console.log(ppItem, 'va arriba de ', SOURCEcurr);
          // debo verificar que no aparezca más adelante, dando lugar a una inconsistencia
          for (let ss = sidx+1; ss < phaseConfig.stages.length; ss++) {
            const SOURCEnext = getStageSOURCEItems(phaseConfig.stages[ss]);
            if (getIndexOf(SOURCEnext, ppItem) > -1) {
              console.log('ppItem', ppItem);
              console.log('SOURCEcurr', SOURCEcurr);
              console.log('SOURCEnext', SOURCEnext);
              throw new Error(`ppItem esta por delante de curr, pero aparece en una stage siguiente: next`);
            }
          }
          out.push(ppItem);
          pidx++;
        } else {
          // en caso contrario va debajo, por lo que se agregan los elementos de s y se deja de conciderar ese stage
          out.push(...getStageFinalItems(stageConfig));
          sidx++;
          // out.push(ppItem);
        }

      } else { // ppItem está en SOURCE, entonces va indirectamente a traves de stage
        // si va indirectamente, hay que verificar su nivel dentro del SOURCE_s - pLevel
        const ppIndexInSOURCE = getIndexOf(SOURCEcurr, ppItem);
        // a partir de plevel, los elementos de SOURCE_s y los pnext deben coincidir
        for (let sourceItemIdx = ppIndexInSOURCE; sourceItemIdx < SOURCEcurr.length; sourceItemIdx++) {
          const sourceItem = SOURCEcurr[sourceItemIdx];
          const ppItemAux = prevGenericRankList[pidx];
          if (!areEqualsGenericRankItem(sourceItem, ppItemAux)) {
            console.log(sourceItem, ppItemAux, 'index', sourceItemIdx, pidx);
            throw new Error(`deberían ser iguales sourceItem y el ppItem`);
          }
          pidx++;
        }
        out.push(...getStageFinalItems(stageConfig));
        sidx++;

      }
    }
  }

  return out;
}

interface IGenericRankItem {
  s: string;
  p: number;
}

interface GenericRankList {
  list: IGenericRankItem[];
}
function areEqualsGenericRankItem(a: IGenericRankItem, b: IGenericRankItem): boolean {
  return a.s == b.s && a.p == b.p;
}

function getIndexOf(list: IGenericRankItem[], item: IGenericRankItem): number {
  if (list.filter(e => areEqualsGenericRankItem(e, item)).length > 1) {
    throw new Error(`hay un elemento repetido`);
  }
  let out = -1;
  list.forEach((e, i: number) => { if (areEqualsGenericRankItem(e, item)) out = i })
  return out;

}

// mover a stages
export function getStageSOURCEItems(stageConfig: IStageConfig) {
  const out: IGenericRankItem[] = [];
  stageConfig.qualifyConditions.forEach(qc => {
    for (let r = qc.minRankPos; r <= qc.maxRankPos; r++) out.push({ s: qc.rankId, p: r });
  })
  return out;
}

export function getStageFinalItems(stageConfig: IStageConfig) {
  const out: IGenericRankItem[] = [];
  let participantsNumber = 0;
  stageConfig.bombos.forEach(b => participantsNumber += b);

  for (let r = 1; r <= participantsNumber; r++) {
    const elem = { s: `sr_${stageConfig.idConfig}`, p: r }; // OJO
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