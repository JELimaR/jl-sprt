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
type TypeDivisionList = { d1: ITournamentConfig, d2?: ITournamentConfig,  cup?: ITournamentConfig };
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
  if (fede.getDivisionsConfig.cup) {
    const cup = new Tournament({ id: `cup_${fede.id}_${season}`, season }, fede.getDivisionsConfig.cup, cal)
    tournamentsMap.set(cup.info.id, cup);
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
        table: selection.slice(0, 8).map((e, i) => { return { team: e, rank: i + 1, originId: 'fr_f014' } })
      }
    },
    getDivisionsConfig: { d1: div1TournamentConfig_v1 },
  }

  const ranking: TypeRanking = federation_014.getRanking();
  globalFinishedRankingsMap.set(ranking.rankId, ranking);

  // season 1986
  const runSeason = (season: number) => {
    const cal1 = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, season).getIJDateTimeCreator());
    mostrarFecha(cal1.now);
    initSeasonFunc(federation_014, cal1, season);

    exampleAdvance(cal1)

    console.log('---------------------------------------------------------------------------------')
    const td1 = tournamentsMap.get(`d1i_${federation_014.id}_${season}`);
    td1?.phases.forEach(p => {
      console.log(td1.info.id)
      console.log(p.info.id)
      p.stages.forEach((s: TGS) => {
        console.log(s.info.id)
        console.table(s.getTable('finished').map(e => e.getInterface()));
      })
      console.table(p.getRelativeRank().table.map(e => { return { ...e, team: e.team.id } }));
    })
    console.log('td1', td1?.getRelativeRank().table.map(e => { return { ...e, team: e.team.id } }))

    console.log('---------------------------------------------------------------------------------')
    const td2 = tournamentsMap.get(`d2i_${federation_014.id}_${season}`);
    td2?.phases.forEach(p => {
      console.log(td2.info.id)
      console.log(p.info.id)
      p.stages.forEach((s: TGS) => {
        console.log(s.info.id)
        if (s instanceof StageGroup) {
          console.log('group table:', s.info.id)
          s.getTableOfGroups('finished').forEach(gr => {
            console.table(gr.map(e => e.getInterface()));
          })
        }
        console.table(s.getTable('finished').map(e => e.getInterface()));
      })
      console.table(p.getRelativeRank().table.map(e => { return { ...e, team: e.team.id } }));
    })
    console.log('td2', td2?.getRelativeRank().table.map(e => { return { ...e, team: e.team.id } }))
    console.log('---------------------------------------------------------------------------------')
    const cup = tournamentsMap.get(`cup_${federation_014.id}_${season}`);
    cup?.phases.forEach(p => {
      console.log(cup.info.id)
      console.log(p.info.id)
      p.stages.forEach((s: TGS) => {
        console.log(s.info.id)
        console.table(s.getTable('finished').map(e => e.getInterface()));
      })
      console.table(p.getRelativeRank().table.map(e => { return { ...e, team: e.team.id } }));
    })
    console.log('cup', cup?.getRelativeRank().table.map(e => { return { ...e, team: e.team.id } }))

    // al final de la season hay nuevo ranking de federacion
    let fedSeasonRanking: TypeRanking = globalFinishedRankingsMap.get('fr_f014i')!;
    if (season == 1986) {
      // nuevos equipos afiliados
      selection.slice(8, 22).forEach((t, i) => fedSeasonRanking.table.push({ team: t, rank: i + 9, originId: 'fr_f014' }))
    }    
    if (season < 1988) {
      td1?./*phases/*.get(`${td1.info.id}_p1`)![0].*/getRelativeRank().table.forEach((ri, i) => fedSeasonRanking.table[i] = { ...ri, originId: 'f014' });
      globalFinishedRankingsMap.set(fedSeasonRanking.rankId, fedSeasonRanking);
    } else {
      td1?./*phases/*.get(`${td1.info.id}_p1`)![0].*/getRelativeRank().table.forEach((ri, i) => {
        const rpos = i < 8 ? i : i + 2;
        fedSeasonRanking.table[rpos] = { ...ri, rank: rpos + 1, originId: 'tr_' + td1.config.idConfig }
      });
      td2?./*phases/*.get(`${td2.info.id}_p2`)![1].*/getRelativeRank().table.forEach((ri, i) => {
        const rpos = i < 2 ? i + 8 : i + 10;
        fedSeasonRanking.table[rpos] = { ...ri, rank: rpos + 1, originId: 'tr_' + td2.config.idConfig }
      });

      globalFinishedRankingsMap.set(fedSeasonRanking.rankId, fedSeasonRanking);
    }

    console.table(globalFinishedRankingsMap.get('fr_f014i')!.table.map((e: RankItem) => { return { ...e, team: e.team.id } }));

    // agrego nueva division:
    if (season == 1987) {
      federation_014.getDivisionsConfig = {
        d1: div1TournamentConfig_v2,
        d2: div2TournamentConfig,
        cup: cupTournamentConfig,
      }
    }
  }

  for (let season = 1982; season <= 1996; season++) {
    console.log('********************************************************************************')
    console.log('************************ Nueva temporada:', season, '*****************************')
    runSeason(season)
    console.log('********************************************************************************')
  }

}

/**
 * data
 */
/** d1_v1 */
const div1StageConfig_01_v1: IStageGroupConfig = {
  idConfig: 'd1i_f014_sg1',
  name: '1 Div',
  type: 'group',

  hwStart: 18,
  intervalOfDrawDate: 185,
  hwEnd: 92,

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
const div1TournamentConfig_v1: ITournamentConfig = {
  idConfig: 'd1i_f014', name: 'd1 f014',
  hwStart: 1,
  hwEnd: 108,

  phases: [
    {
      n: 1, idConfig: 'd1i_f014_p1', name: 'Phase 1',
      hwStart: 18, hwEnd: 92, stages: [ div1StageConfig_01_v1 ]
    }
  ]
}
/** d1_v2 */
const div1StageConfig_01_v2: IStageGroupConfig = {
  idConfig: 'd1i_f014_sg1',
  name: '1 Div',
  type: 'group',

  hwStart: 18,
  intervalOfDrawDate: 185,
  hwEnd: 92,

  bombos: [10],
  drawRulesValidate: [],
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
const div1TournamentConfig_v2: ITournamentConfig = {
  idConfig: 'd1i_f014', name: 'd1 f014',
  hwStart: 1,
  hwEnd: 108,

  phases: [
    {
      n: 1, idConfig: 'd1i_f014_p1', name: 'Phase 1',
      hwStart: 16, hwEnd: 93, stages: [div1StageConfig_01_v2 ]
    }
  ]
}
/** d2_v1 */
const div2StageConfig_01: IStageGroupConfig = {
  idConfig: 'd2i_f014_sg1',
  name: '1 Div',
  type: 'group',

  hwStart: 18,
  intervalOfDrawDate: 185,
  hwEnd: 78,

  bombos: [2, 2, 4, 4],
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
const div2StageConfig_02: IStagePlayoffConfig = {
  idConfig: 'd2i_f014_sp2',
  name: '1 Div',
  type: 'playoff',

  hwStart: 80,
  intervalOfDrawDate: 185,
  hwEnd: 84,

  bombos: [2, 2],
  drawRulesValidate: [{ origin: 'all', minCount: 0 }],

  qualifyConditions: [{ rankId: 'sr_d2i_f014_sg1', season: 'previus', minRankPos: 1, maxRankPos: 4 }],

  bsConfig: {
    idConfig: 'p',
    name: '1 Div',
    opt: 'h&a',
    participantsNumber: 4,
    roundsNumber: 1,
    roundHalfWeeks: [
      [80, 82],
      // [86, 90]
    ],
    roundHalfWeeksSchedule: [80],
  }
}

const div2StageConfig_03: IStagePlayoffConfig = {
  idConfig: 'd2i_f014_sp3',
  name: '2 div - final',
  type: 'playoff',

  hwStart: 86,
  intervalOfDrawDate: 185,
  hwEnd: 92,

  bombos: [2],
  drawRulesValidate: [{ origin: 'all', minCount: 0 }],

  qualifyConditions: [{ rankId: 'sr_d2i_f014_sp2', season: 'previus', minRankPos: 1, maxRankPos: 2 }],

  bsConfig: {
    idConfig: 'p',
    name: '2 Div',
    opt: 'neutral',
    participantsNumber: 2,
    roundsNumber: 1,
    roundHalfWeeks: [
      [92, 92]
    ],
    roundHalfWeeksSchedule: [86],
  }
}
const div2StageConfig_04: IStagePlayoffConfig = {
  idConfig: 'd2i_f014_sp4',
  name: '3er puesto',
  type: 'playoff',

  hwStart: 86,
  intervalOfDrawDate: 185,
  hwEnd: 92,

  bombos: [2],
  drawRulesValidate: [{ origin: 'all', minCount: 0 }],

  qualifyConditions: [{ rankId: 'sr_d2i_f014_sg1', season: 'previus', minRankPos: 11, maxRankPos: 12 }],

  bsConfig: {
    idConfig: 'p',
    name: '1 Div',
    opt: 'neutral',
    participantsNumber: 2,
    roundsNumber: 1,
    roundHalfWeeks: [
      [91, 91]
    ],
    roundHalfWeeksSchedule: [86],
  }
}
const div2TournamentConfig: ITournamentConfig = {
  idConfig: 'd2i_f014', name: 'd2 f014',
  hwStart: 1,
  hwEnd: 108,

  phases: [
    {
      n: 1, idConfig: 'd2i_f014_p1', name: 'Phase 1',
      hwStart: 16, hwEnd: 78, stages: [div2StageConfig_01 ]
    },
    {
      n: 2, idConfig: 'd2i_f014_p2', name: 'Phase 2',
      hwStart: 80, hwEnd: 84, stages: [div2StageConfig_02 ]
    },
    {
      n: 3, idConfig: 'd2i_f014_p3', name: 'Phase 3',
      hwStart: 86, hwEnd: 92, stages: [
        div2StageConfig_03 ,
         div2StageConfig_04 ,
      ]
    }
  ]
}

/** 
 * Agrego torneo de copa
 * total 22 equipos
 * s1 - 12 y clasifican 6
 * s2 se agregan 10 participantes que vienen de arriba!
*/
const cupStageConfig_01: IStagePlayoffConfig = {
  idConfig: 'c1i_f014_sp01',
  name: 'phase preliminar',
  type: 'playoff',

  hwStart: 35,
  intervalOfDrawDate: 185,
  hwEnd: 50,

  bombos: [12],
  drawRulesValidate: [],

  qualifyConditions: [{ rankId: 'fr_f014i', season: 'previus', minRankPos: 11, maxRankPos: 22 }],

  bsConfig: {
    idConfig: 'p',
    name: '1 Div',
    opt: 'h&a',
    participantsNumber: 12,
    roundsNumber: 1,
    roundHalfWeeks: [
      [41, 43]
    ],
    roundHalfWeeksSchedule: [40],
  }
}
const cupStageConfig_02: IStagePlayoffConfig = {
  idConfig: 'c1i_f014_sp02',
  name: 'phase playoff',
  type: 'playoff',

  hwStart: 51,
  intervalOfDrawDate: 185,
  hwEnd: 87,

  bombos: [10, 6],
  drawRulesValidate: [],

  qualifyConditions: [
    { rankId: 'fr_f014i', season: 'previus', minRankPos: 1, maxRankPos: 10 },
    { rankId: 'sr_c1i_f014_sp01', season: 'previus', minRankPos: 1, maxRankPos: 6 },
  ],

  bsConfig: {
    idConfig: 'p',
    name: '1 Div',
    opt: 'h&a',
    participantsNumber: 16,
    roundsNumber: 4,
    roundHalfWeeks: [
      [53, 55], [59, 61], [65, 67], [71, 73]
    ],
    roundHalfWeeksSchedule: [52, 56, 62, 68],
  }
}

const cupTournamentConfig: ITournamentConfig = {
  idConfig: 'cup_f014', name: 'cup f014',
  hwStart: 1,
  hwEnd: 108,

  phases: [
    {
      n: 1, idConfig: 'cup_f014_p1', name: 'Phase 1',
      hwStart: 30, hwEnd: 50, stages: [cupStageConfig_01 ]
    },
    {
      n: 2, idConfig: 'cup_f014_p2', name: 'Phase 2',
      hwStart: 51, hwEnd: 90, stages: [cupStageConfig_02 ]
    },
  ]
}