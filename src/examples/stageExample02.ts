
import JCalendar from "../JCalendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import StageGroup from "../Tournament/Stage/StageGroup/StageGroup";
import mostrarFecha from "../mostrarFechaBorrar";
import exampleAdvance from "./exampleAdvance";
import stageExampleData from "./stageExampleData";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import Team from "../JSportModule/data/Team";
import TeamTableItem from "../JSportModule/Ranking/TeamTableItem";
import { IRankItem, TypeRanking, Ranking } from "../JSportModule";

const {
  s3,
  s4,
} = stageExampleData;
const selection = getExampleTeams(150, 'Team');

export default function stageExample02() {

  const rankItemArr: IRankItem[] = selection.map((t: Team, i: number) => { return { pos: i + 1, team: t, origin: 'rankingInicial' } });
  const ranking: TypeRanking = { context: 'rankingInicial', items: rankItemArr, teams: rankItemArr.map(e => e.team) }
  globalFinishedRankingsMap.set(ranking.context, Ranking.fromTypeRanking(ranking));

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)

  const SE3 = new StageGroup(s3.info, s3.config, cal);
  const SE4 = new StageGroup(s4.info, s4.config, cal);
  
  exampleAdvance(cal)
  // console.log(cal.events[cal.events.length-1])
  
  console.table(SE3.getTable('finished').map((e: TeamTableItem) => e.getInterface()))
  console.table(SE4.getTable('finished').map((e: TeamTableItem) => e.getInterface()))

  console.log(SE3.groups.map(l => {
    return l.teamsArr.map((t => t.id))
  }))
  
  console.log(SE4.groups.map(l => {
    console.table(l.getTable('partial').map(e => e.getInterface()))
    return l.teamsArr.map((t => t.id))
  }))

  globalFinishedRankingsMap.forEach((ranking: Ranking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.getRankTable().map((e: IRankItem) => {return {...e, team: e.team.id}}));
    }
  })

}