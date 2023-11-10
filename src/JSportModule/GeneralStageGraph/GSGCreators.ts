
import { TypeBaseStageOption } from "..";
import { IGenericRank } from "../interfaces";
import { GeneralStageGraph, PhaseNode } from "./GeneralStageGraph";
import { FinalNode, InitialNode, IStageNodeData, RankGroupNode, StageNode } from "./nodes";
import { TableStageNode, TransferStageNode } from "./NoneStageNode";
import { StageGroupNode, StagePlayoffNode } from "./RealStageNode";

export type TInitialCreator = {
  genericRank: IGenericRank;
  rankGroupNumbers: number[];
};
export type TStageNodeCreator = {
  type: 'group' | 'playoff';
  value: number;
  opt: TypeBaseStageOption;
} | {
  type: 'transfer' | 'table';
  value: number;
};
export type TPhaseCreator = {
  id: number;
  stages: {
    count: number;
    stage: TStageNodeCreator;
  }[];
};

const validatePhaseCreatorQuantities = (tpc: TPhaseCreator) => {

}

/**************************************************************************************************************** */
function createInitialNode(tic: TInitialCreator) {
  // initial node
  const initialNode = new InitialNode({
    id: 'ini',
    nodeLvl: 0,
    rankGroups: tic.rankGroupNumbers,
    qualyRank: tic.genericRank,
  });
  return initialNode;
}

function createFinalNode() {
  // final node
  const finalNode = new FinalNode({
    id: 'fin',
    nodeLvl: 0,
  });
  return finalNode;
}

export function createGSG(iniCreator: TInitialCreator, phaseCreatorArr: TPhaseCreator[]) {

  const gsg = new GeneralStageGraph();

  // creo initialNode
  const initialNode = createInitialNode(iniCreator);
  gsg.addNode(initialNode);

  // creo las phases
  let currPhaseIndex = 0;
  let prevPhaseRGs = gsg.getTargetNeigbhors(initialNode) as RankGroupNode[];
  console.log('prevPhaseRGs', prevPhaseRGs);
  
  while (currPhaseIndex < phaseCreatorArr.length) {
    console.log(currPhaseIndex);
    const currPhaseCreator = phaseCreatorArr[currPhaseIndex];
    const phase = createPhaseNodes(gsg, currPhaseCreator, prevPhaseRGs, currPhaseIndex)

    prevPhaseRGs = phase.getTargetRanksGroups();

    currPhaseIndex++;
  }

  // creo el finalnode
  const finalNode = createFinalNode();
  gsg.addNode(finalNode);
  prevPhaseRGs.forEach((rgn: RankGroupNode) => {
    console.log(rgn)
    gsg.addDirectedEdge(rgn, finalNode);
  })


  return gsg;
}

function createPhaseNodes(gsg: GeneralStageGraph, phaseCreator: TPhaseCreator, prevPhaseRGs: RankGroupNode[], currPhaseIndex: number) {
  verifyPhaseCreator(phaseCreator, prevPhaseRGs);
  let prevPhaseRGsIndex = 0;
  const stageNodeArr: StageNode<IStageNodeData>[] = [];
  phaseCreator.stages.forEach((value: { count: number; stage: TStageNodeCreator; }, index: number) => {
    // create stagenode
    const stageRGs: RankGroupNode[] = [];
    for (let i = 0; i < value.count; i++) {
      const rg = prevPhaseRGs[prevPhaseRGsIndex];
      stageRGs.push(rg);
      prevPhaseRGsIndex++;
    }

    // creamos y agregamos el stage al gsg
    const sid = `p${stringPad(currPhaseIndex + 1, 2)}_s${stringPad(index + 1, 2)}`;
    const stageNode = createStage(sid, value.stage, stageRGs);
    gsg.addNode(stageNode);

    // agregamos los source al stage node
    stageRGs.forEach((rg: RankGroupNode) => {
      gsg.addDirectedEdge(rg, stageNode);
    })
    stageNodeArr.push(stageNode);
  })

  return new PhaseNode(currPhaseIndex, stageNodeArr, gsg);
}

const verifyPhaseCreator = (phaseCreator: TPhaseCreator, prevPhaseRGs: RankGroupNode[]) => {
  const phaseSourcesRequired = phaseCreator.stages.reduce((partialSum, a) => partialSum + a.count, 0);
  if (phaseSourcesRequired !== prevPhaseRGs.length) {
    throw new Error(
      `La phase ${phaseCreator.id} requiere de ${phaseSourcesRequired} rank groups de la phase anterior.
      mientras que la phase anterior genera un total de ${prevPhaseRGs.length} rank groups.
      En PhaseCreator de GSGCreator.`
    )
  }
}

function createStage(sid: string, stageCreator: TStageNodeCreator, stageRGs: RankGroupNode[]) {
  let out: StageNode<IStageNodeData>;
  const nodeData: IStageNodeData = {
    id: sid,
    nodeLvl: 0,
    participants: stageRGs.reduce((partialSum, a) => partialSum + a.data.gNumber, 0)
  };
  switch (stageCreator.type) {
    case 'group':
      out = new StageGroupNode({
        ...nodeData,
        groupsNumber: stageCreator.value,
        opt: stageCreator.opt
      })
      break;
    case 'playoff':
      out = new StagePlayoffNode({
        ...nodeData,
        roundsNumber: stageCreator.value,
        opt: stageCreator.opt
      })
      break;
    case 'transfer':
      out = new TransferStageNode({
        ...nodeData,
      })
      break;
    case 'table':
      out = new TableStageNode({
        ...nodeData,
        qNumber: stageCreator.value
      })
      break;
    default:
      throw new Error(`no existe stagenode del tipo: ${stageCreator}`)
  }

  return out;
}

const stringPad = (n: number, pad: number = 2) => {
  return `${String(n).padStart(pad, '0')}`
}