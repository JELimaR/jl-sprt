import { JDateTime } from "../JCalendar/JDateTimeModule";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import { RankItem, TypeRanking } from "../Tournament/Rank/ranking";
import exampleAdvance from "./exampleAdvance";
import StageGroup, { IStageGroupConfig } from "../Tournament/Stage/StageGroup/StageGroup";
import JCalendar from "../JCalendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import mostrarFecha from "../mostrarFechaBorrar";
import Tournament, { ITournamentConfig } from "../Tournament/Tournament";
import { TGS } from "../Tournament/types";
import { IStagePlayoffConfig } from "../Tournament/Stage/StagePlayoff/StagePlayoff";

/**
 * 5 temporadas de un sistema de liga de 2 divisiones.
 * primeras 2 con sus 8 fundadores, luego se asocian 14 instituciones más -> d1: 10 - d2: 12 (6,6).
 */
type TypeDivisionList = { d1: ITournamentConfig, d2?: ITournamentConfig };
const selection = getExampleTeams(150, 'Team');
interface IFederationData {
  id: string;
  getRanking: () => TypeRanking;
  getDivisionsConfig: TypeDivisionList;
}
const tournamentsMap = new Map<string, Tournament>();

/**
 * 
 */
const initSeasonFunc = (fede: IFederationData, cal: JCalendar, season: number) => {
  const tournamentd1 = new Tournament({ id: `d1i_${fede.id}_${season}`, season }, fede.getDivisionsConfig.d1, cal)
  tournamentsMap.set(tournamentd1.info.id, tournamentd1);
  if (fede.getDivisionsConfig.d2) {
    const tournamentd2 = new Tournament({ id: `d2i_${fede.id}_${season}`, season }, fede.getDivisionsConfig.d2, cal)
    tournamentsMap.set(tournamentd2.info.id, tournamentd2);
  }
}
/**
 * 
 */
export default function tournamentExample01() {
  const federation_014: IFederationData = {
    id: 'f014',
    getRanking: () => {
      return {
        rankId: 'fr_f014i',
        table: selection.slice(0, 8).map((e, i) => { return { team: e, rank: i + 1, originId: 'f014' } })
      }
    },
    getDivisionsConfig: { d1: tconfigd1_v1 },
  }

  const ranking: TypeRanking = federation_014.getRanking();
  globalFinishedRankingsMap.set(ranking.rankId, ranking);

  // season 1986
  const runSeason = (season: number) => {
    const cal1 = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, season).getIJDateTimeCreator());
    mostrarFecha(cal1.now);
    initSeasonFunc(federation_014, cal1, season);

    exampleAdvance(cal1)

    const td1 = tournamentsMap.get(`d1i_${federation_014.id}_${season}`);
    td1?.stages.forEach((s: TGS) => {
      console.log(td1.info.id)
      console.log(s.info.id)
      console.table(s.getTable('finished').map(e => e.getInterface()));
    })
    const td2 = tournamentsMap.get(`d2i_${federation_014.id}_${season}`);
    td2?.stages.forEach((s: TGS) => {
      console.log('---------------------------------------------------------------------------------')
      console.log(td2.info.id)
      console.log(s.info.id)
      if (s instanceof StageGroup) {
        console.log('group table:', s.info.id)
        s.getTableOfGroups('finished').forEach(gr => {
          console.table(gr.map(e => e.getInterface()));    
        })
      }
      console.log('stage table')
      console.table(s.getTable('finished').map(e => e.getInterface()));
    })

    // al final de la season hay nuevo ranking de federacion
    let fedSeasonRanking: TypeRanking = globalFinishedRankingsMap.get('fr_f014i')!;
    if (season == 1986) {
      // nuevos equipos afiliados
      selection.slice(8, 22).forEach((t, i) => fedSeasonRanking.table.push({ team: t, rank: i + 9, originId: 'f014' }))
    }
    if (season < 1988) {
      td1?.stages.get(`${td1.info.id}_s1`)!.getRelativeRank().table.forEach((ri, i) => fedSeasonRanking.table[i] = { ...ri, originId: 'f014' });
      globalFinishedRankingsMap.set(fedSeasonRanking.rankId, fedSeasonRanking);
    } else {
      td1?.stages.get(`${td1.info.id}_s1`)!.getRelativeRank().table.forEach((ri, i) => {
        const rpos = i < 8 ? i : i + 2;
        fedSeasonRanking.table[rpos] = { ...ri, rank: rpos + 1, originId: 'f014' }
      });
      td2?.stages.get(`${td2.info.id}_s1`)!.getRelativeRank().table.forEach((ri, i) => {
        if (i > 3)
          fedSeasonRanking.table[i + 10] = { ...ri, rank: i + 10 + 1, originId: 'f014' }
      });
      td2?.stages.get(`${td2.info.id}_s2`)!.getRelativeRank().table.forEach((ri, i) => {
        const rpos = i < 2 ? i + 8 : i + 10;
        fedSeasonRanking.table[rpos] = { ...ri, rank: rpos + 1, originId: 'f014' }
      });

      globalFinishedRankingsMap.set(fedSeasonRanking.rankId, fedSeasonRanking);
      const printDeps: string[] = []
      td2?.phases.forEach((tp) => printDeps.push(...tp.getDependencyIds()))
      console.log(printDeps)
    }

    console.table(globalFinishedRankingsMap.get('fr_f014i')!.table.map((e: RankItem) => { return { ...e, team: e.team.id } }));

    // agrego nueva division:
    if (season == 1987) {
      federation_014.getDivisionsConfig = {
        d1: tconfigd1_v2,
        d2: tconfigd2_v1
      }
    }
  }

  [1986, 1987, 1988, 1989, 1990].forEach((s: number) => runSeason(s))

}

/**
 * data
 */
/** d1_v1 */
const sconfigd1_v1: IStageGroupConfig = {
  idConfig: 'd1i_f014_sg1',
  name: '1 Div',
  type: 'group',

  halfWeekOfStartDate: 18,
  intervalOfDrawDate: 185,
  halfWeekOfEndDate: 92,

  bombos: [8],
  drawRulesValidate: [],
  participantsPerGroup: [8],

  qualifyConditions: [{ rankId: 'fr_f014i', season: 'previus', minRankPos: 1, maxRankPos: 8 }],

  bsConfig: {
    idConfig: 'l',
    name: '1 Div',
    opt: 'h&a',
    participantsNumber: 8,
    turnHalfWeeks: [
      22, 26, 30, 34, 38, 42, 46,
      68, 72, 76, 80, 84, 88, 92
    ],
    turnHalfWeeksSchedule: [
      19, 19, 19, 19, 19, 19, 19,
      65, 65, 65, 65, 65, 65, 65
    ],
  }
}
const tconfigd1_v1: ITournamentConfig = {
  idConfig: 'd1i_f014', name: 'd1 f014',
  halfWeekOfEndDate: 1,
  halfWeekOfStartDate: 108,

  stages: [{phase: 1, config: sconfigd1_v1}]
}
/** d1_v2 */
const sconfigd1_v2: IStageGroupConfig = {
  idConfig: 'd1i_f014_sg1',
  name: '1 Div',
  type: 'group',

  halfWeekOfStartDate: 18,
  intervalOfDrawDate: 185,
  halfWeekOfEndDate: 92,

  bombos: [10],
  drawRulesValidate: [{ origin: 'all', minCount: 5 }],
  participantsPerGroup: [10],

  qualifyConditions: [{ rankId: 'fr_f014i', season: 'previus', minRankPos: 1, maxRankPos: 10 }],

  bsConfig: {
    idConfig: 'l',
    name: '1 Div',
    opt: 'h&a',
    participantsNumber: -1,
    turnHalfWeeks: [
      22, 26, 30, 34, 38, 42, 44, 46, 48,
      66, 68, 72, 76, 80, 84, 88, 90, 92
    ],
    turnHalfWeeksSchedule: [
      19, 19, 19, 19, 19, 19, 19, 19, 19,
      65, 65, 65, 65, 65, 65, 65, 65, 65
    ],
  }
}
const tconfigd1_v2: ITournamentConfig = {
  idConfig: 'd1i_f014', name: 'd1 f014',
  halfWeekOfEndDate: 1,
  halfWeekOfStartDate: 108,

  stages: [{phase: 1, config: sconfigd1_v2}]
}
/** d2_v1 */
const sconfigd2_01_v1: IStageGroupConfig = {
  idConfig: 'd2i_f014_sg1',
  name: '1 Div',
  type: 'group',

  halfWeekOfStartDate: 18,
  intervalOfDrawDate: 185,
  halfWeekOfEndDate: 78,

  bombos: [2, 2, 4, 4  ],
  drawRulesValidate: [],
  participantsPerGroup: [6, 6],

  qualifyConditions: [{ rankId: 'fr_f014i', season: 'previus', minRankPos: 11, maxRankPos: 22 }],

  bsConfig: {
    idConfig: 'l',
    name: '2 Div',
    opt: 'h&a',
    participantsNumber: -1,
    turnHalfWeeks: [
      24, 28, 32, 35, 40, 44,
      64, 70, 74, 78
    ],
    turnHalfWeeksSchedule: [
      19, 19, 19, 19, 19, 19,
      61, 61, 61, 61,
    ],
  }
}
const sconfigd2_02_v1: IStagePlayoffConfig = {
  idConfig: 'd1i_f014_sp2',
  name: '1 Div',
  type: 'playoff',

  halfWeekOfStartDate: 80,
  intervalOfDrawDate: 185,
  halfWeekOfEndDate: 92,

  bombos: [2, 2],
  drawRulesValidate: [{ origin: 'all', minCount: 0 }],

  qualifyConditions: [{ rankId: 'sr_d2i_f014_sg1', season: 'previus', minRankPos: 1, maxRankPos: 4 }],

  bsConfig: {
    idConfig: 'p',
    name: '1 Div',
    opt: 'h&a',
    participantsNumber: 4,
    roundsNumber: 2,
    roundHalfWeeks: [
      [80, 82],
      [86, 90]
    ],
    roundHalfWeeksSchedule: [80, 86],
  }
}
const tconfigd2_v1: ITournamentConfig = {
  idConfig: 'd2i_f014', name: 'd2 f014',
  halfWeekOfEndDate: 1,
  halfWeekOfStartDate: 108,

  stages: [{phase: 1, config: sconfigd2_01_v1}, {phase: 2, config: sconfigd2_02_v1}],
}