
import { renderToPNG } from 'graphology-canvas/node';
import { GeneralStageGraph, NodeAttributes, PhaseNode } from '../JSportModule/GeneralStageGraph/GeneralStageGraph';
import { TInitialCreator, TPhaseCreator, createGSG } from '../JSportModule/GeneralStageGraph/GSGCreators';
import { StageNode, IStageNodeData, RankGroupNode, InitialNode } from '../JSportModule/GeneralStageGraph/nodes';
import { getExampleRankItemsListOrdered, getFederationRankings, getInitialRankingExample,  } from './graphData01';
import { tournamentFromGSG } from '../JSportModule/GeneralStageGraph/tournamentFromGSG';
import Tournament from '../Tournament/Tournament';
import JCalendar from '../JCalendar/JCalendar';
import exampleAdvance from './exampleAdvance';
import { globalFinishedRankingsMap } from '../Tournament/Rank/globalFinishedRankingsMap';
import { Ranking } from '../JSportModule/data/Ranking/Ranking';
import { IGenericRankItem } from '../JSportModule/data/Ranking/interfaces';
import Team from '../JSportModule/data/Team';
import Phase from '../Tournament/Phase';
import { renderGSGtoPNG } from '../JSportModule/GeneralStageGraph/renderGSGtoPNG';

export default function graphExample() {

  // console.log(new StagePlayoffNode({ id: 'o', nodeLvl: 0, opt: 'h&a', participants: 128, roundsNumber: 7 }).getRanksGroups().map(e => e.getInterface().items))

  console.log('--------------------graph example--------------------------')
  const iniCreator: TInitialCreator = {
    tournamentId: 'first_tournament',
    qualyrankList: getExampleRankItemsListOrdered(),
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
        { count: 4, stage: { type: 'transfer', value: 1 } },
      ]
    },
    {
      id: 5,
      stages: [
        { count: 1, stage: { type: 'playoff', value: 1, opt: 'neutral' } },
        { count: 7, stage: { type: 'transfer', value: 1 } },
      ]
    }
  ];
  const gsg = createGSG(iniCreator, phaseCreatorArr);
  const asp = gsg.getAllSimplePath('ini', 'fin');
  console.log(asp.length)

  console.log('getHwsNumber', gsg.getHwsNumberMinimum())
  console.log('getHwsNumberPerPhase', gsg.getHwsNumberPerPhase());

  renderGSGtoPNG(gsg);

  console.log('-------------------------------------------------------------')
  // const finalStage = gsg.getNode('p05_s01');
  // console.log('finalStage', finalStage)
  // console.log(finalStage.getRanksGroups())
  // console.log(phases);
  // console.log('nodes', gsg._graph.nodes())
  // console.log('edges', gsg._graph.edges())
  // console.log(JSON.parse(JSON.stringify(gsg._graph)).edges)
  // console.log(gsg._graph.edge('ini', 'r_ini_1'))
  // console.log('sources', gsg.getSourceNeigbhors('p01_s01'))
  // console.log('targets', gsg.getTargetNeigbhors('p01_s01'))


  const tournamentConfig = tournamentFromGSG({
    gsg,
    matchList: [22, 24, 30, 32, 40, 42, 44, 48, 50, 52, 56, 58, 62, 64, 70, 72, 80],
    schedList: [20, 20, 25, 25, 40, 40, 40, 46, 46, 46, 53, 53, 62, 62, 68, 68, 73],
  });

  console.log(tournamentConfig)

  const cal = new JCalendar({ day: 1568688, interv: 0 });
  const tournament = new Tournament({ id: 'dfki', season: 1988 }, tournamentConfig, cal)

  /*************************************************************************** */
  console.log('-------------------------------------------------------------')
  const fedRankings = getFederationRankings(14);
  fedRankings.forEach((franking: Ranking ) => globalFinishedRankingsMap.set(franking.context, franking));

  // asignar teams
  const iniRankings = gsg.getInitialRankings()
  let currIdx = 0;

  const ini_ttiidd_ranking = iniRankings[0].getInterface();
  ini_ttiidd_ranking.items = [];
  iniRankings.forEach((rank: Ranking, ri: number) => {
    console.log(ri, rank);
    const teams: Team[] = [];
    rank.getGenericRankItems().forEach((value: IGenericRankItem, index: number) => {
      const sourceItem = gsg.getQualyRankList()[currIdx];
      
      // console.log(value);
      // console.log('sourceItem', sourceItem);

      const sourceRanking = globalFinishedRankingsMap.get(sourceItem.origin);
      if (!sourceRanking) {
        // console.log(globalFinishedRankingsMap.keys())
        // console.log(sourceItem.origin)
        throw new Error(``);
      }
      
      const team = sourceRanking.getFromPosition(sourceItem.pos).team;
      teams.push(team);

      currIdx++;
    })
    
    rank.addTeams(teams);
    ini_ttiidd_ranking.items.push(...rank.getGenericRankItems())
    ini_ttiidd_ranking.teams.push(...teams)

  })
  globalFinishedRankingsMap.set(iniRankings[0].context, Ranking.fromTypeRanking(ini_ttiidd_ranking));

  // console.log(`
  //   *******************************************************************************************
  //       ESTA FALTANDO ASIGNAR Y GUARDAR LOS RANKINGS EN GLOBALRANK PARA PODER INICIAR
  //                   LOS TOURNAMENTS
  //   *******************************************************************************************
  // `)
  console.log(globalFinishedRankingsMap.keys())
  // throw new Error(`stop`)
  exampleAdvance(cal)
  console.table(rankingToTable(globalFinishedRankingsMap.get('ini_first_tournament')!))

  // tournament.phases.forEach((p: Phase) => {
  //   console.table(rankingToTable(p.getRelativeRank()))
  // })

  // throw new Error(`stop`)

  console.table(rankingToTable(tournament.getRelativeRank()))
  
  // gsg._phases.forEach((pn: PhaseNode) => {
  //   // const tr: TypeRanking = { context: 'p' + (pn.phaseNumber + 1), items: [], teams: [] };
  //   console.log(pn.phaseNumber + 1)
  //   pn.stages.forEach((st: StageNode<IStageNodeData>) => {
  //     console.log(JSON.stringify(st.getRanksGroups().map(e => e.getInterface()), null, 2))
  //   })
  //   console.log('\n\n')
  // })

}
/************************************************************************************************************** */
function rankingToTable(rank: Ranking) {
  return rank.getRankTable().map(e => {return { ...e, team: e.team.id }})
}