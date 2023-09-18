import { JDateTime } from "../Calendar/DateTime/JDateTime";
import JCalendar from "../Calendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import mostrarFecha from "../mostrarFechaBorrar";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import { JRankCalculator, RankItem, TypeRanking } from "../Tournament/Rank/Rank";
import TeamTableItem from "../Tournament/Rank/TeamTableItem";
import StageGroup from "../Tournament/Stage/StageGroup/StageGroup";
import Team from "../Tournament/Team";
import exampleAdvance from "./exampleAdvance";
import stageExampleData from "./stageExampleData";


const {
  s3,
  s4,
} = stageExampleData;
const selection = getExampleTeams(150, 'Team');

export default function stageExample02() {

  const rankItemArr: RankItem[] = selection.map((t: Team, i: number) => { return { rank: i + 1, team: t, originId: 'rankingInicial' } });
  const ranking: TypeRanking = { rankId: 'rankingInicial', table: rankItemArr }
  globalFinishedRankingsMap.set(ranking.rankId, ranking);

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)

  const SE3 = new StageGroup(s3.info, s3.config, cal);
  const SE4 = new StageGroup(s4.info, s4.config, cal);
  
  exampleAdvance(cal)
  // console.log(cal.events[cal.events.length-1])
  
  console.table(JRankCalculator.getTableStageGroup(SE3, 'finished').map((e: TeamTableItem) => e.getInterface()))
  console.table(JRankCalculator.getTableStageGroup(SE4, 'finished').map((e: TeamTableItem) => e.getInterface()))

  console.log(SE3.groups.map(l => {
    return l.teamsArr.map((t => t.id))
  }))
  
  console.log(SE4.groups.map(l => {
    console.table(JRankCalculator.getTableBase(l, 'partial').map(e => e.getInterface()))
    return l.teamsArr.map((t => t.id))
  }))

  globalFinishedRankingsMap.forEach((ranking: TypeRanking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.table.map((e: RankItem) => { return { ...e, team: e.team.id } }));
    }
  })

}