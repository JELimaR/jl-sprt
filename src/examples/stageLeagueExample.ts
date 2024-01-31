import JCalendar from "../JCalendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import mostrarFecha from "../mostrarFechaBorrar";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import StageGroup from "../Tournament/Stage/StageGroup/StageGroup";
import exampleAdvance from "./exampleAdvance";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import { IStageGroupConfig } from "../JSportModule";
import { IRankItem } from "../JSportModule/Ranking";
import { Ranking, TypeRanking } from "../JSportModule/Ranking";
import Team from "../JSportModule/data/Team";
import TeamTableItem from "../JSportModule/Ranking/TeamTableItem";

const selection = getExampleTeams(150, 'Team');

export default function stageLeagueExample() {

  const rankItemArr: IRankItem[] = selection.map((t: Team, i: number) => { return { pos: i + 1, team: t, origin: 'rankingInicial' } });
  const ranking: Ranking = Ranking.fromRankItemArr('rankingInicial', rankItemArr);
  globalFinishedRankingsMap.set(ranking.context, ranking);

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)

  const SG = new StageGroup({id: 'League', season: 168}, stageLeagueconfig, cal);
  
  exampleAdvance(cal)
  
  // console.log()
  mostrarFecha(cal.events[0].dateTime)
  
  console.table(SG.getTable('finished').map((e: TeamTableItem) => e.getInterface()))

  console.log(SG.groups.map(l => {
    return l.teamsArr.map((t => t.id))
  }))

  globalFinishedRankingsMap.forEach((ranking: Ranking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.getRankTable().map((e: IRankItem) => { return { ...e, team: e.team.id } }));
    }
  })

}

const stageLeagueconfig: IStageGroupConfig = {
  idConfig: 'firstLeague',
  name: '1st Division',
  type: 'group',
  
  hwStart: 9,
  intervalOfDrawDate: 204,
  hwEnd: 93,
  
  bombos: [20],
  drawRulesValidate: [],
  participantsPerGroup: [20],

  qualifyConditions: [{rankId: 'rankingInicial', season: 'previus', minRankPos: 1, maxRankPos: 20}],

  bsConfig: {
    idConfig: 'idLeague',
    name: '',
    opt: 'h&a',
    participantsNumber: -1,
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
