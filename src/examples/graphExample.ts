
import { generateFederations, getExampleTeams } from "../Entities/ExampleData";
import { GeneralStageGraph, NodeAttributes } from "../GeneralStageGraph/GeneralStageGraph";
import { getExampleGenericRankItems, getInitialRanksGroupsExample } from "../GeneralStageGraph/graphData01";
import { IFederationData } from "../JSportModule";
import { IGenericRank, IGenericRankItem } from "../JSportModule/interfaces";
import {  InitialNode, IStageNodeData, StageNode } from "../GeneralStageGraph/nodes";
import { TransferStageNode } from "../GeneralStageGraph/NoneStageNode";
import { StageGroupNode, StagePlayoffNode } from "../GeneralStageGraph/RealStageNode";

export default function graphExample() {

  console.log('--------------------graph example--------------------------')

  const gsg = new GeneralStageGraph();
  createInitialNode(gsg);
  const ini = gsg.getNodeAttributes('ini') as InitialNode;
 
  const phases: (CombinedPhase)[] = [];
  // fase 1:
  console.log('\n--------------------creando phase 1-----------------------------------');
  // de abajo hacia arriba
  console.log('ini getRanksGroups', ini.getRanksGroups());
  let participants: number;
  if (ini.areAllUsed()) console.log('allUsed');
  participants = ini.useNextUnderGroup();
  const sp1 = new StagePlayoffNode({nodeLvl: 0, id: 'sp1', participants, opt: 'h&a', roundsNumber: 1});
  participants = ini.useNextUnderGroup();
  console.log('getRanksGroups', sp1.getRanksGroups());

  const st2 = new TransferStageNode({nodeLvl: 0, id: 'st2', participants});
  if (ini.areAllUsed()) console.log('allUsed');
  participants = ini.useNextUnderGroup();
  console.log('getRanksGroups', st2.getRanksGroups());

  const st3 = new TransferStageNode({nodeLvl: 0, id: 'st3', participants});
  if (ini.areAllUsed()) console.log('allUsed');
  console.log('getRanksGroups', st3.getRanksGroups());

  gsg.addNode(st3.getId(), st3);
  gsg.addDirectedEdge(ini.getId(), st3.getId())

  gsg.addNode(st2.getId(), st2);
  gsg.addDirectedEdge(ini.getId(), st2.getId())

  gsg.addNode(sp1.getId(), sp1);
  gsg.addDirectedEdge(ini.getId(), sp1.getId())
  const ph1: CombinedPhase = new CombinedPhase(1, [st3, st2, sp1]) /*{
    phaseNumber: 1,
    stages: [st3, st2, sp1]
  }*/
  phases.push(ph1);
  console.log('\n--------------------creando phase 2-----------------------------------');
  console.log('phase01 getRankGroups', ph1.getRanksGroupsNumber())
  // de abajo hacia arriba
  participants = ph1.getRanksGroupsNumber()[3];





  // const attr = ini as InitialNode;
  // attr.rankGroups.forEach((igr: IGenericRank) => {
  //   console.log(igr.list);
  // })

  console.log('-------------------------------------------------------------')
  console.log(phases);
  console.log(gsg.nodes())
  console.log(gsg.edges())
  console.log(gsg)
}

function createInitialNode(gsg: GeneralStageGraph) {
  // initial node
  const iniRankGroups: IGenericRank[] = getInitialRanksGroupsExample();
  const initialNode = new InitialNode({
    id: 'ini',
    nodeLvl: 0,
    rankGroups: iniRankGroups
  });
  // console.log(initialNode)
  gsg.addNode(initialNode.getId(), initialNode);
}

class CombinedPhase {
  constructor(
    public phaseNumber: number,
    public stages: StageNode<IStageNodeData>[],
  ) {

  }
  getRanksGroupsNumber() {
    const out: number[] = [];
    this.stages.forEach((sn: StageNode<IStageNodeData>) => {
      out.push(...sn.getRanksGroups());
    })
    return out;
  }
}