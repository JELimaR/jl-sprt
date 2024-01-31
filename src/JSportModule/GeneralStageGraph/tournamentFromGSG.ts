import { TypeHalfWeekOfYear } from "../../JCalendar/JDateTimeModule";
import { IPhaseConfig, IStageConfig, IStageGroupConfig, IStagePlayoffConfig, ITournamentConfig, TQualyCondition, verifyStageConfig, verifyTournamentConfig } from "../data";
import { Ranking, IGenericRankItem } from "../Ranking";
import { GeneralStageGraph, PhaseNode } from "./GeneralStageGraph";
import { IStageNodeData, RankGroupNode, StageNode } from "./nodes";
import { IRealStageNodeData, RealStageNode, StageGroupNode, StagePlayoffNode } from "./RealStageNode";

interface ITournamentFromGSGData {
  name: string;
  gsg: GeneralStageGraph;
  matchList: TypeHalfWeekOfYear[];
  schedList: TypeHalfWeekOfYear[];
}

/**
 * verificar si está bien definido (el utlimo de la primera lista de rank puede llegar al primero de la ultima lista de rank)
 * verificar que la cantidad total de hwList proporcionada sea igual a la cantidad de hws necesarias
 * para cada phaseNode crear su IPhaseConfig si corresponde
 * generar los source (GenericRank) y el target (GenericRank) de cada stage
 * 
 */
export function tournamentFromGSG(entry: ITournamentFromGSGData): ITournamentConfig {
  let out: ITournamentConfig;
  // console.log('algo')
  // * verificar si está bien definido (el utlimo de la primera lista de rank puede llegar al primero de la ultima lista de rank)
  const lastIniRN = entry.gsg.getTargetNeigbhors('ini')[entry.gsg.getTargetNeigbhors('ini').length - 1];
  const firstFinRN = entry.gsg.getSourceNeighbors('fin')[0];
  const simplePathArr = entry.gsg.getAllSimplePath(lastIniRN, firstFinRN);
  if (simplePathArr.length <= 0) {
    throw new Error(`No se cumple la siguiente verificación:
    * verificar si está bien definido (el utlimo de la primera lista de rank puede llegar al primero de la ultima lista de rank).
    Es decir, el que inicialmente está calificado más abajo no puede llegar al primer lugar.
    En tournamentFromGSG`);
  }

  /* 
   * generar tournament config
   */

  // * para cada phaseNode crear su IPhaseConfig si corresponde
  const phases: IPhaseConfig[] = [];
  let startIdx = 0;
  let endIdx = 0;
  entry.gsg._phases.forEach((phaseNode: PhaseNode) => {
    startIdx = endIdx;
    endIdx += phaseNode.getHwsNumber();
    if (startIdx != endIdx) {
      // console.log(phaseNode.getHwsNumber(), entry.matchList.slice(startIdx, endIdx))
      const pc = phaseFromPhaseNode(phaseNode, {
        ...entry,
        matchList: entry.matchList.slice(startIdx, endIdx),
        schedList: entry.schedList.slice(startIdx, endIdx),
      });
      if (pc !== 'none') phases.push(pc)
    }
  })

  // creacion y verificacion
  out = {
    name: entry.name, idConfig: entry.gsg.getTournamentId(),
    hwStart: entry.schedList[0], hwEnd: entry.matchList[entry.matchList.length -1],
    phases
  }

  verifyTournamentConfig(out);
  return out;
  
}

function phaseFromPhaseNode(phaseNode: PhaseNode, entry: ITournamentFromGSGData): IPhaseConfig | 'none' {
  // console.log('phaseFromPhaseNode', phaseNode.phaseNumber);
  const stages: IStageConfig[] = [];
  const rankItemList: IGenericRankItem[] = [];
  phaseNode.stages.forEach((stageNode: StageNode<IStageNodeData>) => {
    stageNode.getRanksGroups().forEach((stageRank: Ranking) => {
      rankItemList.push(...stageRank.getGenericRankItems());
    })
    if (stageNode instanceof RealStageNode) {
      const sc = stageFromStageNode(stageNode, entry);
      verifyStageConfig(sc);
      stages.push(sc);
    }
  })
  if (stages.length > 0) {
    return {
      idConfig: '', name: 'phase',
      hwStart: entry.schedList[0], hwEnd: entry.matchList[entry.matchList.length - 1],

      rankItemList: rankItemList,

      n: phaseNode.phaseNumber,
      stages
    }
  } else {
    return 'none';
  }
}

/**
 * Crea un IStageConfig a partir de un stageNode
 */
function stageFromStageNode(stageNode: RealStageNode<IRealStageNodeData>, entry: ITournamentFromGSGData): IStageConfig {
  let group: IStageGroupConfig;
  let playoff: IStagePlayoffConfig;

  // halfweeks de schedule de matches y matches
  const HALFWEEKS = halfWeeksForStageAssignation(entry.matchList, stageNode.getHwsNumber());
  const HALFWEEKS_SCHEDULE = halfWeeksForStageAssignation(entry.schedList, stageNode.getHwsNumber());

  // lista de los source y bombos
  const sourcesRankGroup = entry.gsg.getSourceNeighbors(stageNode) as RankGroupNode[];
  let bombos: number[] = stageNode.data.bombos || sourcesRankGroup.map(rg => rg.data.sourceData.size);

  // creacion de los qualyconditions
  let qualifyConditions: TQualyCondition[] = [];
  sourcesRankGroup.forEach((rgn: RankGroupNode) => {
    const qc: TQualyCondition = rgn.data.sourceData.getQualyCondition();
    const qc_getted = qualifyConditions.find(e => e.rankId == qc.rankId);
    if (qc_getted) {
      qc_getted.maxRankPos = qc.maxRankPos;
    } else {
      qualifyConditions.push(qc);
    }
  })
  // console.log('qualifyConditions', qualifyConditions)
  // console.log('sourcesRankGroup', sourcesRankGroup.map(e => e.getRanksGroups().map(ie => JSON.stringify(ie.getGenericRankItems()))))

  if (stageNode instanceof StageGroupNode) {
    // console.log('\n\nstage***************************', stageNode.getHwsFromList(HALFWEEKS))
    group = {
      idConfig: stageNode.data.id, type: "group", name: 'Group',
      hwStart: entry.schedList[0], hwEnd: entry.matchList[entry.matchList.length-1],

      participantsPerGroup: stageNode.getParticipantsPerGroup(),
      bombos,
      
      drawRulesValidate: [], // falta
      
      qualifyConditions,

      intervalOfDrawDate: 149, // falta

      bsConfig: {
        name: 'GG',
        idConfig: `${stageNode.data.id}_g`,
        opt: stageNode.data.opt,
        turnHalfWeeks: stageNode.getHwsFromList(HALFWEEKS),
        turnHalfWeeksSchedule: HALFWEEKS_SCHEDULE,
        participantsNumber: -1,
      }
    }
    return group;
  } else if (stageNode instanceof StagePlayoffNode) {
    playoff = {
      idConfig: stageNode.data.id, type: "playoff", name: 'Playoff',
      hwStart: entry.schedList[0], hwEnd: entry.matchList[entry.matchList.length-1],

      bombos,
      
      drawRulesValidate: stageNode.data.draw?.rules || [],
      
      qualifyConditions,

      intervalOfDrawDate: stageNode.data.draw?.interv,

      bsConfig: {
        name: 'CC',
        idConfig: stageNode.data.id + '_p',
        opt: stageNode.data.opt,
        roundHalfWeeks: stageNode.getHwsFromList(HALFWEEKS),
        roundHalfWeeksSchedule: stageNode.getSchedHwsFromList(HALFWEEKS_SCHEDULE),
        roundsNumber: stageNode.data.roundsNumber,
        participantsNumber: stageNode.data.participants,
      }
    }
    return playoff;
  } else {
    throw new Error(`Tipo de stage node invalido. (stageFromStageNode -- tournamentFromGSG)`)
  }
}

/**
 * halfWeeksForStageAssignation genera un array de halfweeks para asignar a un stage,
 * con la cantidad solicitada a partir de un array con las halfweeks disponibles
 * @param hwsList: opciones disponibles
 * @param count: cantidad solicitada o necesaria 
 */
function halfWeeksForStageAssignation(hwsList: TypeHalfWeekOfYear[], count: number): TypeHalfWeekOfYear[] {
	const listLength = hwsList.length;
	const STEP = count/listLength;
	let out: TypeHalfWeekOfYear[] = [];
	hwsList.forEach((hw: TypeHalfWeekOfYear, idx: number) => {
		if (Math.round((idx)*STEP) == out.length) {
			out.push(hw);
		}
	})

	return out;
}