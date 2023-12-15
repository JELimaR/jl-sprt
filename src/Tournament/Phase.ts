import JCalendar from "../JCalendar/JCalendar";
import { TypeHalfWeekOfYear } from "../JCalendar/JDateTimeModule";
import { IElementInfo, IPhaseConfig, IStageConfig, IStageGroupConfig, IStagePlayoffConfig, TCC } from "../JSportModule";
import { IGenericRankItem } from "../JSportModule/data/Ranking/interfaces";
import { Ranking, TypeRanking } from "../JSportModule/data/Ranking/Ranking";
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
        // console.log(globalFinishedRankingsMap.keys())
        // console.log(sourceItem.origin)
        throw new Error(``);
      }
      
      const team = sourceRanking.getFromPosition(item.pos).team;
      out.teams.push(team);
    })
    
    return Ranking.fromTypeRanking(out);
  }
  
  // // en la phase, si las stages estan en orden, se mantiene el orden en el rank, de lo contrario se combinan
  // private getRelativeRank2(): TypeRanking {
  //   let rankItemOut: RankItem[] = [];
  //   let genericRank = getGenericRankItemsSortedForPhaseN(this.config, this._previusPhaseConfigsArr);

  //   let previusRank: TypeRanking = { rankId: 'none', table: [] };
  //   if (!!this._previusPhase) previusRank = this._previusPhase.getRelativeRank2();

  //   const stagesArr = this.stages;
  //   let prevR = -1;
  //   genericRank.forEach((elem, i) => {
  //     const stage = stagesArr.filter(s => s.config.idConfig == elem.s.slice(3, 80))[0];
  //     if (!stage) {
  //       if (!previusRank) throw new Error(`debería existir un previusRank para ${this.config.idConfig}. (Phase.getRelativeRank)`)
  //       let finded = false;
  //       let prevRankItem;
  //       do {
  //         prevR++;
  //         prevRankItem = previusRank.table[prevR];
  //         if (!prevRankItem) {
  //           console.log('previusRank.table', previusRank.table);
  //           console.log('index', prevR)
  //           console.log(this.config.idConfig, genericRank)
  //           console.log('elem', elem)
  //         }
  //         finded = areEqualsGenericRankItem(elem, { s: prevRankItem.originId, p: prevRankItem.rank });
  //       } while (!finded)
  //       rankItemOut.push({
  //         originId: prevRankItem.originId,
  //         team: prevRankItem.team,
  //         rank: elem.p,
  //       })
        
  //     } else {
  //       const stageRank = stage.getRelativeRank();
  //       rankItemOut.push({
  //         originId: elem.s,
  //         team: stageRank.table[elem.p - 1].team,
  //         rank: i + 1,
  //       })
  //     }
  //   })

  //   return {
  //     rankId: 'pr_' + this.config.idConfig,
  //     table: rankItemOut
  //   }
  // }

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
/***************************************************************************************************************************************** */
// lista de los genericRankItemsId de la phase 1
// export function getGenericRankItemsSortedForPhase01(phaseConfig: IPhaseConfig): IGenericRankItem[] {
//   const out: IGenericRankItem[] = [];
//   phaseConfig.stages.forEach((config) => {
//     let stageParticipants = 0;
//     config.bombos.forEach(b => stageParticipants += b);
//     for (let p = 1; p <= stageParticipants; p++) {
//       const elem = { s: `sr_${config.idConfig}`, p }; // OJO
//       out.push(elem);
//     }
//   })

//   return out;
// }

// lista de los genericRankItemsId de la phase n
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
// export function getGenericRankItemsSortedForPhaseN(phaseConfig: IPhaseConfig, previus: IPhaseConfig[]): IGenericRankItem[] {
//   // console.log('--------------stageMapRankForPhaseN---------------------')
//   const out: IGenericRankItem[] = [];
//   if (previus.length == 0) {
//     return getGenericRankItemsSortedForPhase01(phaseConfig)
//   }
//   // const prevConfig = [...previus].pop();
//   // const prevGenericRankList = getGenericRankItemSortedForPhaseN(prevConfig!, previus);
//   const prevGenericRankList = getGenericRankItemsSortedForPhaseN(previus[previus.length - 1], previus.slice(0, previus.length - 1));
//   const notConsideredStages = [...phaseConfig.stages];

//   let pidx = 0;
//   // let ppItem: IGenericRankItem = prevGenericRankList_copy[pidx];
//   let sidx = 0;
//   // let SOURCEcurr = getStageSOURCEItems(notConsideredStages[sidx]);
//   while (pidx < prevGenericRankList.length) {
//     let ppItem: IGenericRankItem = prevGenericRankList[pidx];
//     // p no debe estar en ninguno de los prev_s
//     for (let ss = 0; ss < sidx; ss++) {
//       // console.log(phaseConfig.idConfig, ss)
//       const SOURCEprev = getStageSOURCEItems(phaseConfig.stages[ss]);
//       if (getIndexOf(SOURCEprev, ppItem) > -1) {
//         console.log('ppItem', ppItem)
//         console.log('SOURCEprev', SOURCEprev)
//         console.log('out', out)
//         throw new Error(`pp aparece en SOURCEprev`)
//       }
//     }
//     // hay que verificar si p va directo o indirectamente a traves de s.
//     const stageConfig = notConsideredStages[sidx];
//     if (!stageConfig) {
//       // como no hay otra s, todos van directo manteniendo el orden
//       for (let pp = pidx; pp < prevGenericRankList.length; pp++) {
//         out.push(ppItem);
//         pidx++;
//         ppItem = prevGenericRankList[pidx];
//       }
//     } else {
//       const SOURCEcurr = getStageSOURCEItems(stageConfig);
//       // hay que verificar si p va directo o indirectamente a traves de s.
//       const ppItem_SourceIndex = getIndexOf(SOURCEcurr, ppItem);
//       if (ppItem_SourceIndex == -1) { // ppItem no está en SOURCE, entonces va directo o en el siguiente SOURCE
//         //  puede ir arriba o debajo
//         // va arriba solo si hay elementos de prevGenericRankList no considerados que estan dentro de algun SOURCE (verificar en s),
//         let vaArriba = false;
//         for (let pp = pidx + 1; pp < prevGenericRankList.length && !vaArriba; pp++) {
//           const ppAux = prevGenericRankList[pp];
//           vaArriba = (getIndexOf(SOURCEcurr, ppAux) !== -1);
//         }
//         if (vaArriba) {
//           // console.log(ppItem, 'va arriba de ', SOURCEcurr);
//           // debo verificar que no aparezca más adelante, dando lugar a una inconsistencia
//           for (let ss = sidx + 1; ss < notConsideredStages.length; ss++) {
//             const SOURCEnext = getStageSOURCEItems(notConsideredStages[ss]);
//             if (getIndexOf(SOURCEnext, ppItem) > -1) {
//               console.log('ppItem', ppItem);
//               console.log('SOURCEcurr', SOURCEcurr);
//               console.log('SOURCEnext', SOURCEnext);
//               throw new Error(`ppItem esta por delante de curr, pero aparece en una stage siguiente: next`);
//             }
//           }
//           out.push(ppItem);
//           pidx++;
//         } else {
//           // en caso contrario va debajo, por lo que se agregan los elementos de s y se deja de conciderar ese stage
//           out.push(...getStageFinalItems(stageConfig));
//           sidx++;
//           // out.push(ppItem);
//         }

//       } else { // ppItem está en SOURCE, entonces va indirectamente a traves de stage
//         // si va indirectamente, hay que verificar su nivel dentro del SOURCE_s - pLevel
//         const ppIndexInSOURCE = getIndexOf(SOURCEcurr, ppItem);
//         // a partir de plevel, los elementos de SOURCE_s y los pnext deben coincidir
//         for (let sourceItemIdx = ppIndexInSOURCE; sourceItemIdx < SOURCEcurr.length; sourceItemIdx++) {
//           const sourceItem = SOURCEcurr[sourceItemIdx];
//           const ppItemAux = prevGenericRankList[pidx];
//           if (!areEqualsGenericRankItem(sourceItem, ppItemAux)) {
//             console.log(sourceItem, ppItemAux, 'index', sourceItemIdx, pidx);
//             throw new Error(`deberían ser iguales sourceItem y el ppItem`);
//           }
//           pidx++;
//         }
//         out.push(...getStageFinalItems(stageConfig));
//         sidx++;
//       }
//     }
//   }

//   return out;
// }

// function areEqualsGenericRankItem(a: IGenericRankItem, b: IGenericRankItem): boolean {
//   return a.s == b.s && a.p == b.p;
// }

// function getIndexOf(list: IGenericRankItem[], item: IGenericRankItem): number {
//   if (list.filter(e => areEqualsGenericRankItem(e, item)).length > 1) {
//     throw new Error(`hay un elemento repetido`);
//   }
//   let out = -1;
//   list.forEach((e, i: number) => { if (areEqualsGenericRankItem(e, item)) out = i })
//   return out;

// }

// mover a stages
// export function getStageSOURCEItems(stageConfig: IStageConfig) {
//   const out: IGenericRankItem[] = [];
//   stageConfig.qualifyConditions.forEach(qc => {
//     for (let r = qc.minRankPos; r <= qc.maxRankPos; r++) out.push({ s: qc.rankId, p: r });
//   })
//   return out;
// }

// export function getStageFinalItems(stageConfig: IStageConfig) {
//   const out: IGenericRankItem[] = [];
//   let participantsNumber = 0;
//   stageConfig.bombos.forEach(b => participantsNumber += b);

//   for (let r = 1; r <= participantsNumber; r++) {
//     const elem = { s: `sr_${stageConfig.idConfig}`, p: r }; // OJO
//     out.push(elem);
//   }
//   return out;
// }


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