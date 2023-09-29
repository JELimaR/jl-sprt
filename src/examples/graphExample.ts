
import { getExampleTeams } from "../Entities/ExampleData";
import { GeneralStageGraph, IRankNode, IStageNode, NodeAttributes } from "../GeneralStageGraph";
import { IGenericRank } from "../JSportModule/interfaces";
import { Federation_Div01Node  } from "../nodes";
import { StageGroupNode, StagePlayoffNode } from "../RealStageNode";

export default function graphExample() {

  console.log('graph example')
  const gsg = new GeneralStageGraph();

  const principalStage: IStageNode = generateConvergentStage('lib');

  gsg.addNode(principalStage.id, principalStage);
  
  // La confederation debe definir estos nodes!!
  generateFederationGenericRanks().forEach((igr: IGenericRank, i: number) => {
    const len = i < 2 ? 4 : 3;
    const fedRank: Federation_Div01Node = new Federation_Div01Node(igr.rankId, len);
  })

  const sg = new StageGroupNode('sid1854', 22, 'h&a', 7);
  console.log('getParticipantsPerGroup', sg.getParticipantsPerGroup());
  console.log('getHwsNumber', sg.getHwsNumber());
  console.log('getRanksGroups', sg.getRanksGroups());

  console.log()

  const sp = new StagePlayoffNode('sid1854', 16, 'neutral', 2);
  console.log('getHwsNumber', sp.getHwsNumber());
  console.log('getRanksGroups', sp.getRanksGroups());


}

const generateConvergentStage = (idConfig?: string): IStageNode => {
  return {
    id: idConfig ? idConfig : 'pricipal',
    sLevel: 1,
    type: 'Q',
    subType: 'stg',
    isStage: true,
  }
}

function generateFederationGenericRanks() {
  let out: IGenericRank[] = [];
  for (let fede = 1; fede <= 14; fede++) {
    const fid = `F${String(fede).padStart(3, '0')}`;
    const fteams = getExampleTeams(74, fid);
    let franking: IGenericRank = { rankId: 'fr_' + fid, list: [] };
    fteams.forEach((t, i) => franking.list.push({ origin: fid, pos: i + 1 }))
    out.push(franking);
  }
  return out;
}