import { getExampleTeams } from "../Entities/ExampleData";
import JCalendar from "../JCalendar/JCalendar";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import { IStageGroupConfig, IStagePlayoffConfig, ITournamentConfig } from "../JSportModule";
import mostrarFecha from "../mostrarFechaBorrar";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import { TypeRanking } from "../Tournament/Rank/ranking";
import StageGroup from "../Tournament/Stage/StageGroup/StageGroup";
import Tournament from "../Tournament/Tournament";
import exampleAdvance from "./exampleAdvance";

// se generan 14 rankings.
// simulacion de copa lib (en este caso o en el proximo se simula tambien copa sud)
// 14 + 14 directo a fase de grupos
// 14 + 2 van a fase previa
export default function tournamentExample02() {
  for (let fede = 1; fede <= 14; fede++) {
    const fid = `F${String(fede).padStart(3, '0')}`;
    const fteams = getExampleTeams(45, fid);
    let franking: TypeRanking = { rankId: 'fr_' + fid, table: [] };
    fteams.forEach((t, i) => franking.table.push({ originId: fid, team: t, rank: i + 1 }))
    globalFinishedRankingsMap.set(franking.rankId, franking);
  }

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1999).getIJDateTimeCreator());
  mostrarFecha(cal.now);

  const copaLib = new Tournament({id: 'cplib_1999', season: 1999}, tournamentConfig, cal);
  exampleAdvance(cal)

  copaLib.phases.forEach(p => {
    console.log(p.info.id);
    p.stages.forEach(s => {
      console.log(s.info.id)
      if (s instanceof StageGroup) {
        s.groups.forEach(g => console.table(g.getTable('finished').map(tti => tti.getInterface())))
      }
      console.table(s.getTable('finished').map(tti => tti.getInterface()))
    })
    console.table(p.getRelativeRank().table.map((e => { return { ...e, team: e.team.id } })))
  })
  console.table(copaLib.getRelativeRank().table.map((e => { return { ...e, team: e.team.id } })))
}

const prevStage: IStagePlayoffConfig = {
  idConfig: 'prev_SE', name: 'Stage prev', type: "playoff",
  hwStart: 25, hwEnd: 33, intervalOfDrawDate: 185,
  drawRulesValidate: [{ origin: 'all', minCount: 0 }],
  qualifyConditions: [
    { rankId: 'fr_F001', season: 'previus', minRankPos: 3, maxRankPos: 4 },
    { rankId: 'fr_F002', season: 'previus', minRankPos: 3, maxRankPos: 4 },
    { rankId: 'fr_F003', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F004', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F005', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F006', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F007', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F008', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F009', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F010', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F011', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F012', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F013', season: 'previus', minRankPos: 3, maxRankPos: 3 },
    { rankId: 'fr_F014', season: 'previus', minRankPos: 3, maxRankPos: 3 },
  ],
  bombos: [16],
  bsConfig: {
    idConfig: 'SE', name: 'SE', opt: 'h&a',
    participantsNumber: 16, roundsNumber: 2,
    roundHalfWeeks: [[25, 27], [31, 33]],
    roundHalfWeeksSchedule: [25, 31],
  }
}

const groupStage: IStageGroupConfig = {
  idConfig: 'group', name: 'Stage group', type: "group",
  hwStart: 41, hwEnd: 59, intervalOfDrawDate: 185,
  drawRulesValidate: [{ origin: 'all', minCount: 0 }],
  qualifyConditions: [
    { rankId: 'fr_F001', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F002', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F003', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F004', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F005', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F006', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F007', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F008', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F009', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F010', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F011', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F012', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F013', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    { rankId: 'fr_F014', season: 'previus', minRankPos: 1, maxRankPos: 2 },
    {rankId: 'sr_prev_SE', season: 'current', minRankPos: 1, maxRankPos: 4},
  ],
  participantsPerGroup: [4,4,4,4,4,4,4,4],
  bombos: [14, 14, 4],
  bsConfig: {
    idConfig: 'grp', name: 'group stage', opt: 'h&a',
    participantsNumber: -1, 
    turnHalfWeeks: [43, 45, 47, 53, 55, 57],
    turnHalfWeeksSchedule: [41, 41, 41, 41, 41, 41]
  }
}

const finalStage: IStagePlayoffConfig = {
  idConfig: 'final_SE', name: 'Stage playoff', type: "playoff",
  hwStart: 63, hwEnd: 79, intervalOfDrawDate: 185,
  drawRulesValidate: [{ origin: 'all', minCount: 0 }],
  qualifyConditions: [
    { rankId: 'sr_group', season: 'previus', minRankPos: 1, maxRankPos: 16 },
  ],
  bombos: [8, 8],
  bsConfig: {
    idConfig: 'SE', name: 'SE', opt: 'h&a',
    participantsNumber: 16, roundsNumber: 3,
    roundHalfWeeks: [[65, 67], [71, 73], [77, 79]],
    roundHalfWeeksSchedule: [64, 70, 76],
  }
}

const final: IStagePlayoffConfig = {
  idConfig: 'final_lib', name: 'Stage final', type: "playoff",
  hwStart: 80, hwEnd: 89, intervalOfDrawDate: 185,
  drawRulesValidate: [{ origin: 'all', minCount: 0 }],
  qualifyConditions: [
    { rankId: 'sr_final_SE', season: 'previus', minRankPos: 1, maxRankPos: 2 },
  ],
  bombos: [2],
  bsConfig: {
    idConfig: 'final', name: 'SE', opt: 'neutral',
    participantsNumber: 2, roundsNumber: 1,
    roundHalfWeeks: [[89,89]],
    roundHalfWeeksSchedule: [80],
  }
}

const tournamentConfig: ITournamentConfig = {
  idConfig: 'lib',
  name: 'Copa Lib',
  hwStart: 25,
  hwEnd: 90,
  phases: [
    {
      idConfig: 'lib_p01', n: 1, name: 'Fase Prev',
      hwStart: 25, hwEnd: 33,
      stages: [
        prevStage,
      ]
    },
    {
      idConfig: 'lib_p02', n: 2, name: 'Fase gr',
      hwStart: 41, hwEnd: 61,
      stages: [
        groupStage
      ]
    },
    {
      idConfig: 'lib_p03', n: 3, name: 'Fase playoff',
      hwStart: 62, hwEnd: 79,
      stages: [
        finalStage
      ]
    },
    {
      idConfig: 'lib_p04', n: 4, name: 'Final',
      hwStart: 80, hwEnd: 89,
      stages: [
        final
      ]
    }
  ]
}