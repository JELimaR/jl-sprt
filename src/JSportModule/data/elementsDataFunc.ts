import { areEqualsGenericItems, getIndexOf, IGenericRank, IGenericRankItem, IGenericSource, IGenericSourceItem, sizeGeneric } from "../interfaces";
import { IPhaseConfig, IStageConfig, IStagePlayoffConfig, ITournamentConfig } from "./elementsConfig";

// PUEDE IR EN ALGO RELACIONADO A LOS RANKS
/**************************************************************************************************************************************
 * STAGES
 */
export function getStageGenericSource(stageConfig: IStageConfig): IGenericSource {
  const list: IGenericSourceItem[] = [];
  stageConfig.qualifyConditions.forEach(qc => {
    for (let r = qc.minRankPos; r <= qc.maxRankPos; r++) list.push({ origin: qc.rankId, pos: r });
  })
  return {
    sourceId: `ss_${stageConfig.idConfig}`,
    list
  };
}

export function getStageGenericRank(stageConfig: IStageConfig): IGenericRank {
  const list: IGenericRankItem[] = [];
  let participantsNumber = 0;
  stageConfig.bombos.forEach(b => participantsNumber += b);

  for (let r = 1; r <= participantsNumber; r++) {
    list.push({ origin: `sr_${stageConfig.idConfig}`, pos: r }); // OJO
  }
  return {
    rankId: `sr_${stageConfig.idConfig}`,
    list
  };
}

export function getStageRankToGenerateIds(stageConfig: IStageConfig): string {
  return `sr_${stageConfig.idConfig}`;
}

export function getStageSourceIds(stageConfig: IStageConfig): string[] {
  let out: string[] = [];

  stageConfig.qualifyConditions.forEach(tq => {
    out.push(tq.rankId);
  })

  const setString = new Set(out);
  if (setString.size !== out.length) {
    console.log(out);
    throw new Error(`Los elementos del source de la stage ${stageConfig.idConfig} no pueden repetirse`);
  }

  return out;
}

export function getPlayoffQualiesGroup(playoff: IStagePlayoffConfig) {
  const divN = Math.pow(2, playoff.bsConfig.roundsNumber);
  let qualiesNumber = playoff.bsConfig.participantsNumber/divN;
  if (Math.trunc(qualiesNumber) !== qualiesNumber) {
    throw new Error(`hay una ronda en la singleelimination
    que tiene una cantidad impar de participantes: ${playoff.idConfig}`)
  }
  const gRank = getStageGenericRank(playoff);
  let out: IGenericRankItem[] = [];
  for (let i = 0; i < qualiesNumber; i++) out.push(gRank.list[i]);
  return out;
}

export function getPlayoffNoneQualiesGroup(playoff: IStagePlayoffConfig) {
  const divN = Math.pow(2, playoff.bsConfig.roundsNumber);
  let qualiesNumber = playoff.bsConfig.participantsNumber/divN;
  if (Math.trunc(qualiesNumber) !== qualiesNumber) {
    throw new Error(`hay una ronda en la singleelimination
    que tiene una cantidad impar de participantes: ${playoff.idConfig}`)
  }
  const gRank = getStageGenericRank(playoff);
  let out: IGenericRankItem[] = [];
  for (let i = qualiesNumber; i < sizeGeneric(gRank); i++) out.push(gRank.list[i]);
  return out;
}

/**************************************************************************************************************************************
 * PHASE
 */
// lista de los ranksIds que genera la phase - se puede reubicar
export function getPhaseRankToGenerateIds(phaseConfig: IPhaseConfig): string[] {
  let out: string[] = [];

  phaseConfig.stages.forEach((stageConfig) => {
    out.push(getStageRankToGenerateIds(stageConfig)) // OJO
  })

  return out;
}

export function getPhaseSourceIds(phaseConfig: IPhaseConfig): string[] {
  let out: string[] = [];
  phaseConfig.stages.forEach((stageConfig) => {
    out.push(...getStageSourceIds(stageConfig))
  })

  return out;
}

// lista de los genericRankItemsId de la phase 1
export function getPhase01GenericRankItemsSorted(phaseConfig: IPhaseConfig): IGenericRank {
  const list: IGenericRankItem[] = [];
  phaseConfig.stages.forEach((stageConfig) => {
    list.push(...getStageGenericRank(stageConfig).list)
  })

  return {
    rankId: `pr_${phaseConfig.idConfig}`,
    list
  };
}

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
export function getPhaseNGenericRankItemsSorted(phaseConfig: IPhaseConfig, previus: IPhaseConfig[]): IGenericRank {
  // console.log('--------------stageMapRankForPhaseN---------------------')
  if (previus.length == 0) {
    return getPhase01GenericRankItemsSorted(phaseConfig)
  }
  const list: IGenericRankItem[] = [];
  // const prevConfig = [...previus].pop();
  // const prevGenericRankList = getGenericRankItemSortedForPhaseN(prevConfig!, previus);
  const prevGenericRank = getPhaseNGenericRankItemsSorted(previus[previus.length - 1], previus.slice(0, previus.length - 1));
  const notConsideredStages = [...phaseConfig.stages];

  let pidx = 0;
  // let ppItem: IGenericRankItem = prevGenericRankList_copy[pidx];
  let sidx = 0;
  // let SOURCEcurr = getStageSOURCEItems(notConsideredStages[sidx]);
  while (pidx < prevGenericRank.list.length) {
    let ppItem: IGenericRankItem = prevGenericRank.list[pidx];
    // p no debe estar en ninguno de los prev_s
    for (let ss = 0; ss < sidx; ss++) {
      // console.log(phaseConfig.idConfig, ss)
      const SOURCEprev = getStageGenericSource(phaseConfig.stages[ss]);
      if (getIndexOf(SOURCEprev, ppItem) > -1) {
        console.log('ppItem', ppItem)
        console.log('SOURCEprev', SOURCEprev)
        console.log('out', list)
        throw new Error(`pp aparece en SOURCEprev`)
      }
    }
    // hay que verificar si p va directo o indirectamente a traves de s.
    const stageConfig = notConsideredStages[sidx];
    if (!stageConfig) {
      // como no hay otra s, todos van directo manteniendo el orden
      for (let pp = pidx; pp < prevGenericRank.list.length; pp++) {
        list.push(ppItem);
        pidx++;
        ppItem = prevGenericRank.list[pidx];
      }
    } else {
      const SOURCEcurr = getStageGenericSource(stageConfig);
      // hay que verificar si p va directo o indirectamente a traves de s.
      const ppItem_SourceIndex = getIndexOf(SOURCEcurr, ppItem);
      if (ppItem_SourceIndex == -1) { // ppItem no está en SOURCE, entonces va directo o en el siguiente SOURCE
        //  puede ir arriba o debajo
        // va arriba solo si hay elementos de prevGenericRankList no considerados que estan dentro de algun SOURCE (verificar en s),
        let vaArriba = false;
        for (let pp = pidx + 1; pp < prevGenericRank.list.length && !vaArriba; pp++) {
          const ppAux = prevGenericRank.list[pp];
          vaArriba = (getIndexOf(SOURCEcurr, ppAux) !== -1);
        }
        if (vaArriba) {
          // console.log(ppItem, 'va arriba de ', SOURCEcurr);
          // debo verificar que no aparezca más adelante, dando lugar a una inconsistencia
          for (let ss = sidx + 1; ss < notConsideredStages.length; ss++) {
            const SOURCEnext = getStageGenericSource(notConsideredStages[ss]);
            if (getIndexOf(SOURCEnext, ppItem) > -1) {
              console.log('ppItem', ppItem);
              console.log('SOURCEcurr', SOURCEcurr);
              console.log('SOURCEnext', SOURCEnext);
              throw new Error(`ppItem esta por delante de curr, pero aparece en una stage siguiente: next`);
            }
          }
          list.push(ppItem);
          pidx++;
        } else {
          // en caso contrario va debajo, por lo que se agregan los elementos de s y se deja de conciderar ese stage
          list.push(...getStageGenericRank(stageConfig).list);
          sidx++;
          // out.push(ppItem);
        }

      } else { // ppItem está en SOURCE, entonces va indirectamente a traves de stage
        // si va indirectamente, hay que verificar su nivel dentro del SOURCE_s - pLevel
        const ppIndexInSOURCE = getIndexOf(SOURCEcurr, ppItem);
        // a partir de plevel, los elementos de SOURCE_s y los pnext deben coincidir
        for (let sourceItemIdx = ppIndexInSOURCE; sourceItemIdx < SOURCEcurr.list.length; sourceItemIdx++) {
          const sourceItem = SOURCEcurr.list[sourceItemIdx];
          const ppItemAux = prevGenericRank.list[pidx];
          if (!areEqualsGenericItems(sourceItem, ppItemAux)) {
            console.log(sourceItem, ppItemAux, 'index', sourceItemIdx, pidx);
            throw new Error(`deberían ser iguales sourceItem y el ppItem`);
          }
          pidx++;
        }
        list.push(...getStageGenericRank(stageConfig).list);
        sidx++;
      }
    }
  }

  return {
    rankId: `pr_${phaseConfig.idConfig}`,
    list
  };
}

/**************************************************************************************************************************************
 * TOURNAMENT
 */
export function getStagesOfTournament(tournamentConfig: ITournamentConfig): IStageConfig[] {
  const out: IStageConfig[] = [];
  tournamentConfig.phases.forEach(p => out.push(...p.stages));
  return out;
}

export function getTournamentGenericSourceItems(tournamentConfig: ITournamentConfig): IGenericSource {
  let list: IGenericSourceItem[] = [];


  return {
    sourceId: ``,
    list
  };
}

export function getTournamentGenericRank(tournamentConfig: ITournamentConfig): IGenericRank {
  const phasesLength = tournamentConfig.phases.length;
  const lastPhase = tournamentConfig.phases[phasesLength-1];
  const previusPhases = tournamentConfig.phases.slice(0, phasesLength - 1)

  const outList = getPhaseNGenericRankItemsSorted(lastPhase, previusPhases);
  return {
    rankId: `tr_${tournamentConfig.idConfig}`,
    list: outList.list,
  };

}