
import { TypeBaseStageOption, TypeDrawRulePlayoff } from "..";
import { IGenericRankItem } from "../Ranking/";
import { Ranking } from "../Ranking";
import { GeneralStageGraph, PhaseNode } from "./GeneralStageGraph";
import { FinalNode, InitialNode, IStageNodeData, RankGroupNode, StageNode } from "./nodes";
import { ReOrderStageNode, TableStageNode, TransferStageNode } from "./NoneStageNode";
import { StageGroupNode, StagePlayoffNode } from "./RealStageNode";
import { TypeIntervalOfDay } from "jl-calendar";

export type TInitialCreator = {
  tournamentId: string;
  qualyrankList: IGenericRankItem[];
  rankGroupNumbers: number[];
};
export type TStageNodeCreator = {
  type: 'group' | 'playoff';
  value: number;
  opt: TypeBaseStageOption;
  draw?: {interv: TypeIntervalOfDay, rules: TypeDrawRulePlayoff[]};
  bombos?: number[];
} | {
  type: 'table' | 'reOrder';
  value: number;
} | {
  type: 'transfer';
};
export type TPhaseCreator = {
  id: number;
  stages: {
    count: number;
    stage: TStageNodeCreator;
  }[];
};

// NOTA: stub vacío (no valida nada actualmente). La verificación real de
// cantidades entre fases la hace verifyPhaseCreator (más abajo).
const validatePhaseCreatorQuantities = (tpc: TPhaseCreator) => {

}

/**************************************************************************************************************** */
function createInitialNode(tic: TInitialCreator) {
  // initial node
  const initialNode = new InitialNode({
    id: 'ini',
    tournamentId: tic.tournamentId,
    nodeLvl: 0,
    rankGroups: tic.rankGroupNumbers,
    qualyRankList: tic.qualyrankList,
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

/**
 * createGSG — arma el grafo completo a partir de dos "recetas" declarativas:
 *   - iniCreator: quiénes entran (qualyrankList) y cómo se agrupan (rankGroupNumbers).
 *   - phaseCreatorArr: la lista de fases; cada fase tiene stages que CONSUMEN
 *     rank groups de la fase anterior.
 *
 * El armado va fase por fase: los rank groups producidos por una fase (o por el
 * INI) son los que consume la siguiente. Al final conecta lo que quede con el
 * FinalNode. Esta es la función que el frontend llamará al "materializar" el
 * dibujo del torneo.
 */
export function createGSG(iniCreator: TInitialCreator, phaseCreatorArr: TPhaseCreator[]) {

  const gsg = new GeneralStageGraph(iniCreator.tournamentId);

  // creo initialNode
  const initialNode = createInitialNode(iniCreator);
  gsg.addNode(initialNode);

  // creo las phases
  let currPhaseIndex = 0;
  let prevPhaseRGs = gsg.getTargetNeigbhors(initialNode) as RankGroupNode[];

  while (currPhaseIndex < phaseCreatorArr.length) {
    // console.log(currPhaseIndex);
    const currPhaseCreator = phaseCreatorArr[currPhaseIndex];
    const phase = createPhaseNodes(gsg, currPhaseCreator, prevPhaseRGs, currPhaseIndex)

    prevPhaseRGs = phase.getTargetRanksGroups();

    currPhaseIndex++;
  }

  // creo el finalnode
  const finalNode = createFinalNode();
  gsg.addNode(finalNode);
  prevPhaseRGs.forEach((rgn: RankGroupNode) => {
    // console.log(rgn)
    gsg.addDirectedEdge(rgn, finalNode);
  })


  return gsg;
}

function createPhaseNodes(gsg: GeneralStageGraph, phaseCreator: TPhaseCreator, prevPhaseRGs: RankGroupNode[], currPhaseIndex: number) {
  verifyPhaseCreator(phaseCreator, prevPhaseRGs);
  let prevPhaseRGsIndex = 0;
  const stageNodeArr: StageNode<IStageNodeData>[] = [];
  phaseCreator.stages.forEach((elem: { count: number; stage: TStageNodeCreator; }, index: number) => {
    // create stagenode
    const stageRGs: RankGroupNode[] = [];
    for (let i = 0; i < elem.count; i++) {
      const rg = prevPhaseRGs[prevPhaseRGsIndex];
      stageRGs.push(rg);
      prevPhaseRGsIndex++;
    }

    // creamos y agregamos el stage al gsg
    const sid = `${gsg.id}_p${stringPad(currPhaseIndex + 1, 2)}_s${stringPad(index + 1, 2)}`;
    const stageNode = createStage(sid, elem.stage, stageRGs);
    gsg.addNode(stageNode);

    // agregamos los source al stage node
    stageRGs.forEach((rg: RankGroupNode) => {
      gsg.addDirectedEdge(rg, stageNode);
    })
    stageNodeArr.push(stageNode);
  })

  return new PhaseNode(currPhaseIndex, stageNodeArr, gsg);
}

/**
 * verifyPhaseCreator — coherencia entre fases: la suma de `count` de los stages
 * de la fase (cuántos rank groups consume en total) debe ser igual a la cantidad
 * de rank groups que produjo la fase anterior (o el INI para la primera fase).
 * Si no coincide, el flujo no cierra y el grafo sería inválido.
 */
const verifyPhaseCreator = (phaseCreator: TPhaseCreator, prevPhaseRGs: RankGroupNode[]) => {
  const phaseSourcesRequired = phaseCreator.stages.reduce((partialSum, a) => partialSum + a.count, 0);
  if (phaseSourcesRequired !== prevPhaseRGs.length) {
    console.log('phaseCreator', phaseCreator)
    console.log('prevPhaseRGs', JSON.stringify(prevPhaseRGs, null, 2))
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
    participants: stageRGs.reduce((partialSum, a) => partialSum + a.data.sourceData.size, 0)
  };

  const rankings: Ranking[] = [];
  stageRGs.forEach(rg => rankings.push(...rg.getRanksGroups()))

  switch (stageCreator.type) {
    case 'group':
      out = new StageGroupNode({
        ...nodeData,
        groupsNumber: stageCreator.value,
        opt: stageCreator.opt,
        draw: stageCreator.draw,
        bombos: stageCreator.bombos,
      })
      break;
    case 'playoff':
      out = new StagePlayoffNode({
        ...nodeData,
        roundsNumber: stageCreator.value,
        opt: stageCreator.opt,
        draw: stageCreator.draw,
        bombos: stageCreator.bombos,
      })
      break;
    case 'transfer':
      // solo debe haber un rg?
      out = new TransferStageNode({
        ...nodeData
      },
        rankings
      )
      break;
    case 'table':
      out = new TableStageNode({
        ...nodeData,
        qNumber: stageCreator.value
      },
        rankings
      )
      break;
    // case 'reOrder':
    //   out = new ReOrderStageNode({
    //     ...nodeData,
    //     qNumber: stageCreator.value
    //   },
    //     rankings
    //   )
    default:
      throw new Error(`no existe stagenode del tipo: ${stageCreator}. En GSGCreator.createStage`)
  }

  return out;
}

export const stringPad = (n: number, pad: number = 2) => {
  return `${String(n).padStart(pad, '0')}`
}