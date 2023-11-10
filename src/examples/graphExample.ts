
import { renderToPNG } from 'graphology-canvas/node';
import { IGenericRank, IGenericRankItem } from "../JSportModule/interfaces";
import { TypeBaseStageOption } from "../JSportModule";
import { GeneralStageGraph, NodeAttributes, PhaseNode } from '../JSportModule/GeneralStageGraph/GeneralStageGraph';
import { TInitialCreator, TPhaseCreator, createGSG } from '../JSportModule/GeneralStageGraph/GSGCreators';
import { StageNode, IStageNodeData, RankGroupNode } from '../JSportModule/GeneralStageGraph/nodes';
import { RealStageNode, StageGroupNode, StagePlayoffNode } from '../JSportModule/GeneralStageGraph/RealStageNode';
import { getExampleGenericRankItems } from './graphData01';
import { TableStageNode, TransferStageNode } from '../JSportModule/GeneralStageGraph/NoneStageNode';

export default function graphExample() {

  console.log('--------------------graph example--------------------------')
  const iniCreator: TInitialCreator = {
    genericRank: {rankId: 'initial', list: getExampleGenericRankItems()},
    rankGroupNumbers: [28, 2, 12]
  };

  const phaseCreatorArr: TPhaseCreator[] = [
    {
      id: 1,
      stages: [
        { count: 1, stage: { type: 'transfer', value: 1 } },
        { count: 1, stage: { type: 'transfer', value: 1 } },
        { count: 1, stage: { type: 'playoff', value: 1, opt: 'h&a' } },
      ]
    },
    {
      id: 2,
      stages: [
        { count: 1, stage: { type: 'transfer', value: 1 } },
        { count: 2, stage: { type: 'playoff', value: 1, opt: 'h&a' } },
        { count: 1, stage: { type: 'transfer', value: 1 } },
      ]
    },
    {
      id: 3,
      stages: [
        { count: 2, stage: { type: 'group', value: 8, opt: 'h&a' } },
        { count: 2, stage: { type: 'transfer', value: 1 } },
      ]
    },
    {
      id: 4,
      stages: [
        { count: 2, stage: { type: 'playoff', value: 3, opt: 'h&a' } },
        { count: 3, stage: { type: 'transfer', value: 1 } },
      ]
    },
    {
      id: 5,
      stages: [
        { count: 1, stage: { type: 'playoff', value: 1, opt: 'neutral' } },
        { count: 4, stage: { type: 'transfer', value: 1 } },
      ]
    }
  ];
  const gsg = createGSG(iniCreator, phaseCreatorArr)

  renderGSG(gsg);

  console.log('-------------------------------------------------------------')
  const finalStage = gsg.getNode('p05_s01');
  console.log('finalStage', finalStage)
  console.log(finalStage.getRanksGroups())
  // console.log(phases);
  console.log('nodes', gsg._graph.nodes())
  // console.log('edges', gsg._graph.edges())
  console.log(JSON.parse(JSON.stringify(gsg._graph)).edges)
  // console.log(gsg._graph.edge('ini', 'r_ini_1'))
  // console.log('sources', gsg.getSourceNeigbhors('p01_s01'))
  // console.log('targets', gsg.getTargetNeigbhors('p01_s01'))

}

/************************************************************************************************************** */
function renderGSG(gsg: GeneralStageGraph) {
  /**DIBUJO */
  const XSTEP = 200 / (4 + gsg._phases.length * 2);
  // defino el ini y sus targets
  const mapPositions = new Map<string, { x: number, y: number }>()
  let XNOW = XSTEP - 100;
  const nd = gsg.getNode('ini');
  mapPositions.set(nd.getId(), { x: XNOW, y: 0 });

  const arr = gsg.getTargetNeigbhors(nd);
  XNOW += XSTEP;
  const YSTEP = 200 / (arr.length + 1);
  arr.forEach((value: NodeAttributes, idx: number) => {
    mapPositions.set(value.getId(), { x: XNOW, y: 100-(idx + 1) * YSTEP })
  })

  // defino para cada phase y sus targets
  gsg._phases.forEach((pn: PhaseNode) => {
    XNOW += XSTEP;
    const YSTEP1 = 200 / (pn.stages.length + 1);
    pn.stages.forEach((sn: StageNode<IStageNodeData>, idx: number) => {
      mapPositions.set(sn.getId(), { x: XNOW, y: 100-(idx + 1) * YSTEP1 })
    })

    XNOW += XSTEP;
    const rgArr = pn.getTargetRanksGroups();
    const YSTEP2 = 200 / (rgArr.length + 1);
    rgArr.forEach((value: NodeAttributes, idx: number) => {
      mapPositions.set(value.getId(), { x: XNOW, y: 100-(idx + 1) * YSTEP2 })
    })

  })

  // defino el lugar de finalNode
  mapPositions.set('fin', { x: XNOW + XSTEP, y: 0 })


  renderToPNG(gsg._graph, './graph.png', {
    nodes: {
      defaultColor: '#0000FF',
      reducer: (_, node: string, attributes: NodeAttributes) => {
        let color = '#0A0A0A';
        let size = 40;
        color = attributes.getId() == 'ini' ? '#29524A' : color;
        color = attributes.getId() == 'fin' ? '#4E0110' : color;

        if (attributes instanceof RankGroupNode) {
          color = '#06070E';
          size = 25;
        } else if (attributes instanceof StageGroupNode) {
          color = '#03254E';
        } else if(attributes instanceof StagePlayoffNode) {
          color = '#6184D8';
        } else if(attributes instanceof TransferStageNode) {
          color = '#C5AFA0';
        } else if(attributes instanceof TableStageNode) {
          color = '#E9BCB7';
        }

        return { ...mapPositions.get(node), size, color: color };
      }
    },
    edges: {
      defaultColor: '#0A090C',
      reducer: () => {
        return { directed: true, label: 'o' }
      }
    }
  }, () => { console.log('done') })
}