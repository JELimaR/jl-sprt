
import { JDateTime } from "../Calendar/DateTime/JDateTime";
import JCalendar from "../Calendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import mostrarFecha from "../mostrarFechaBorrar";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import { JRankCalculator, RankItem, TypeRanking } from "../Tournament/Rank/Rank";
import TeamTableItem from "../Tournament/Rank/TeamTableItem";
import StageGroup, { IStageGroupConfig } from "../Tournament/Stage/StageGroup/StageGroup";
import Team from "../Tournament/Team";
import exampleAdvance from "./exampleAdvance";

const selection = getExampleTeams(150, 'Team');

export default function specialStageGroupExample() {

  const rankItemArr: RankItem[] = selection.map((t: Team, i: number) => { return { rank: i + 1, team: t } });
  const ranking: TypeRanking = { rankId: 'rankingInicial', table: rankItemArr }
  globalFinishedRankingsMap.set(ranking.rankId, ranking);

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)

  const SG = new StageGroup({ id: 'League', season: 168 }, stageLeagueconfig, cal);

  exampleAdvance(cal)

  // console.log()
  mostrarFecha(cal.events[0].dateTime)

  console.table(JRankCalculator.getTableStageGroup(SG, 'finished').map((e: TeamTableItem) => e.getInterface()))

  console.log(SG.groups.map(l => {
    return l.teamsArr.map((t => t.id))
  }))

  globalFinishedRankingsMap.forEach((ranking: TypeRanking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.table.map((e: RankItem) => { return { ...e, team: e.team.id } }));
    }
  })

}

const stageLeagueconfig: IStageGroupConfig = {
  idConfig: 'f06',
  name: 'group stage',
  type: 'group',

  halfWeekOfStartDate: 95,
  dayOfDrawDate: { day: 273, interv: 185 },
  halfWeekOfEndDate: 105,

  bombos: [
    { elemsNumber: 13, selectionPerTime: [3, 3, 3, 2, 2] },
    { elemsNumber: 13, selectionPerTime: [2, 2, 3, 3, 3] }
  ],

  drawRulesValidate: [],
  participantsPerGroup: [6, 5, 5, 5, 5],

  qualifyConditions: [{ rankId: 'rankingInicial', season: 'previus', minRankPos: 1, maxRankPos: 26 }],

  bsConfig: {
    idConfig: 'idLeague',
    name: '',
    opt: 'neutral',
    participantsNumber: -1,
    turnHalfWeeks: [
      95, 96, 98, 100, 102
    ],
    turnHalfWeeksSchedule: [
      95, 95, 95, 95, 95
    ],
  }
}