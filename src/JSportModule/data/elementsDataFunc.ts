import { areEqualsGenericItems, getIndexOfItem, IGenericRankItem } from '../Ranking/interfaces'
import { IPhaseConfig, IStageConfig, IStagePlayoffConfig, ITournamentConfig } from "./elementsConfig";

// PUEDE IR EN ALGO RELACIONADO A LOS RANKS
/**************************************************************************************************************************************
 * STAGES
 */
export function getStageGenericSource(stageConfig: IStageConfig): IGenericRankItem[] {
  const out: IGenericRankItem[] = [];
  stageConfig.qualifyConditions.forEach(qc => {
    for (let r = qc.minRankPos; r <= qc.maxRankPos; r++) {
      out.push({ origin: qc.rankId, pos: r });
    }
  })
  return out;
}

export function getStageGenericRank(stageConfig: IStageConfig): IGenericRankItem[] {
  const out: IGenericRankItem[] = [];
  let participantsNumber = 0;
  stageConfig.bombos.forEach(b => participantsNumber += b);

  for (let r = 1; r <= participantsNumber; r++) {
    out.push({ origin: `sr_${stageConfig.idConfig}`, pos: r }); // OJO
  }
  return out;
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

/*****
 * mover funciones y mejorarlas!
 */
export function getPlayoffQualiesGroup(playoff: IStagePlayoffConfig): IGenericRankItem[] {
  const divN = Math.pow(2, playoff.bsConfig.roundsNumber);
  let qualiesNumber = playoff.bsConfig.participantsNumber / divN;
  if (Math.trunc(qualiesNumber) !== qualiesNumber) {
    throw new Error(`hay una ronda en la singleelimination
    que tiene una cantidad impar de participantes: ${playoff.idConfig}`)
  }
  const gRank = getStageGenericRank(playoff);
  let out: IGenericRankItem[] = [];
  for (let i = 0; i < qualiesNumber; i++)
    out.push(gRank[i]);
  return out;
}

export function getPlayoffNoneQualiesGroup(playoff: IStagePlayoffConfig): IGenericRankItem[] {
  const divN = Math.pow(2, playoff.bsConfig.roundsNumber);
  let qualiesNumber = playoff.bsConfig.participantsNumber / divN;
  if (Math.trunc(qualiesNumber) !== qualiesNumber) {
    throw new Error(`hay una ronda en la singleelimination
    que tiene una cantidad impar de participantes: ${playoff.idConfig}`)
  }
  const gRank = getStageGenericRank(playoff);
  let out: IGenericRankItem[] = [];
  for (let i = qualiesNumber; i < gRank.length; i++)
    out.push(gRank[i]);
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
export function getPhase01GenericRankItemsSorted(phaseConfig: IPhaseConfig): IGenericRankItem[] {
  const list: IGenericRankItem[] = [];
  phaseConfig.stages.forEach((stageConfig) => {
    list.push(...getStageGenericRank(stageConfig))
  })

  return list;

  // return {
  //   rankId: `pr_${phaseConfig.idConfig}`,
  //   list
  // };
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
function getPhaseNGenericRankItemsSorted(phaseConfig: IPhaseConfig, previus: IPhaseConfig[]): IGenericRankItem[] {
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
  while (pidx < prevGenericRank.length) {
    let ppItem: IGenericRankItem = prevGenericRank[pidx];
    // p no debe estar en ninguno de los prev_s
    for (let ss = 0; ss < sidx; ss++) {
      // console.log(phaseConfig.idConfig, ss)
      const SOURCEprev = getStageGenericSource(phaseConfig.stages[ss]);
      if (getIndexOfItem(SOURCEprev, ppItem) > -1) {
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
      for (let pp = pidx; pp < prevGenericRank.length; pp++) {
        list.push(ppItem);
        pidx++;
        ppItem = prevGenericRank[pidx];
      }
    } else {
      const SOURCEcurr = getStageGenericSource(stageConfig);
      // hay que verificar si p va directo o indirectamente a traves de s.
      const ppItem_SourceIndex = getIndexOfItem(SOURCEcurr, ppItem);
      if (ppItem_SourceIndex == -1) { // ppItem no está en SOURCE, entonces va directo o en el siguiente SOURCE
        //  puede ir arriba o debajo
        // va arriba solo si hay elementos de prevGenericRankList no considerados que estan dentro de algun SOURCE (verificar en s),
        let vaArriba = false;
        for (let pp = pidx + 1; pp < prevGenericRank.length && !vaArriba; pp++) {
          const ppAux = prevGenericRank[pp];
          vaArriba = (getIndexOfItem(SOURCEcurr, ppAux) !== -1);
        }
        if (vaArriba) {
          // console.log(ppItem, 'va arriba de ', SOURCEcurr);
          // debo verificar que no aparezca más adelante, dando lugar a una inconsistencia
          for (let ss = sidx + 1; ss < notConsideredStages.length; ss++) {
            const SOURCEnext = getStageGenericSource(notConsideredStages[ss]);
            if (getIndexOfItem(SOURCEnext, ppItem) > -1) {
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
          list.push(...getStageGenericRank(stageConfig));
          sidx++;
          // out.push(ppItem);
        }

      } else { // ppItem está en SOURCE, entonces va indirectamente a traves de stage
        // si va indirectamente, hay que verificar su nivel dentro del SOURCE_s - pLevel
        const ppIndexInSOURCE = getIndexOfItem(SOURCEcurr, ppItem);
        // a partir de plevel, los elementos de SOURCE_s y los pnext deben coincidir
        for (let sourceItemIdx = ppIndexInSOURCE; sourceItemIdx < SOURCEcurr.length; sourceItemIdx++) {
          const sourceItem = SOURCEcurr[sourceItemIdx];
          const ppItemAux = prevGenericRank[pidx];
          if (!areEqualsGenericItems(sourceItem, ppItemAux)) {
            console.log(sourceItem, ppItemAux, 'index', sourceItemIdx, pidx);
            throw new Error(`deberían ser iguales sourceItem y el ppItem`);
          }
          pidx++;
        }
        list.push(...getStageGenericRank(stageConfig));
        sidx++;
      }
    }
  }

  return list;
  // return {
  //   rankId: `pr_${phaseConfig.idConfig}`,
  //   list
  // };
}

/**************************************************************************************************************************************
 * TOURNAMENT
 */
export function getStagesOfTournament(tournamentConfig: ITournamentConfig): IStageConfig[] {
  const out: IStageConfig[] = [];
  tournamentConfig.phases.forEach(p => out.push(...p.stages));
  return out;
}

/**
 * PENDIENTE DE REALIZAR
 */
export function getTournamentGenericSourceItems(tournamentConfig: ITournamentConfig): IGenericRankItem[] {
  let list: IGenericRankItem[] = [];

  return list;
}

export function getTournamentGenericRank(tournamentConfig: ITournamentConfig): IGenericRankItem[] {
  const phasesLength = tournamentConfig.phases.length;
  const lastPhase = tournamentConfig.phases[phasesLength - 1];
  const previusPhases = tournamentConfig.phases.slice(0, phasesLength - 1)

  const outList = getPhaseNGenericRankItemsSorted(lastPhase, previusPhases);
  
  return outList;

}