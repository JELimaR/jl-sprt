import { JDateTime } from "../Calendar/DateTime/JDateTime";
import JCalendar from "../Calendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import mostrarFecha from "../mostrarFechaBorrar";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import { JRankCalculator, RankItem, TypeRanking } from "../Tournament/Rank/JRank";
import TeamTableItem from "../Tournament/Rank/TeamTableItem";
import StageGroup, { IStageGroupConfig } from "../Tournament/Stage/StageGroup/StageGroup";
import Team from "../Tournament/Team";
import exampleAdvance from "./exampleAdvance";

const selection = getExampleTeams(150, 'Team');

export default function stageLeagueExample() {

  const rankItemArr: RankItem[] = selection.map((t: Team, i: number) => { return { rank: i + 1, team: t } });
  const ranking: TypeRanking = { rankId: 'rankingInicial', table: rankItemArr }
  globalFinishedRankingsMap.set(ranking.rankId, ranking);

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)

  const SG = new StageGroup({id: 'League', season: 168}, stageLeagueconfig, cal);
  
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
  idConfig: 'firstLeague',
  name: '1st Division',
  type: 'group',
  
  halfWeekOfStartDate: 9,
  dayOfDrawDate: {day: 15, interv: 185},
  halfWeekOfEndDate: 93,
  
  bombos: [20],
  drawRulesValidate: [],
  participantsPerGroup: [20],

  qualifyConditions: [{rankId: 'rankingInicial', season: 'previus', minRankPos: 1, maxRankPos: 20}],

  bsConfig: {
    idConfig: 'idLeague',
    name: '',
    opt: 'h&a',
    participantsNumber: 20,
    turnHalfWeeks: [
      10, 12, 14, 16, 18, 20,
      22, 24, 26, 30, 32, 34,
      36, 38, 40, 42, 44, 46, 48,
      56, 58, 60, 62, 64, 66,
      68, 70, 72, 74, 76, 78,
      80, 82, 84, 86, 88, 90, 92,
    ],
    turnHalfWeeksSchedule: [
      9, 9, 9, 10, 12, 14,
      16, 18, 20, 22, 24, 26,
      28, 30, 32, 34, 36, 38, 40,
      55, 55, 55, 56, 58, 60,
      62, 64, 66, 68, 70, 72,
      74, 76, 78, 80, 80, 80, 92,
    ],
  }
}