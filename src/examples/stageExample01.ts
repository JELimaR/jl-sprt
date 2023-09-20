import { JDateTime } from "../JCalendar/DateTime/JDateTime";
import JCalendar from "../JCalendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import StagePlayoff from "../Tournament/Stage/StagePlayoff/StagePlayoff";
import Team from "../Tournament/Team";
import mostrarFecha from "../mostrarFechaBorrar";
import exampleAdvance from "./exampleAdvance";
import stageExampleData from "./stageExampleData";
import TeamTableItem from "../Tournament/Rank/TeamTableItem";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import { RankItem, TypeRanking } from "../Tournament/Rank/ranking";

const {
  s1,
  s2
} = stageExampleData;
const selection = getExampleTeams(150, 'Team');

export default function stageExample01() {

  const rankItemArr: RankItem[] = selection.map((t: Team, i: number) => { return {rank: i+1, team: t, originId: 'rankingInicial'} });
  const ranking: TypeRanking = { rankId: 'rankingInicial', table: rankItemArr }
  globalFinishedRankingsMap.set(ranking.rankId, ranking);
  
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)
  
  const SE1 = new StagePlayoff(s1.info, s1.config, cal);
  
  const SE2 = new StagePlayoff(s2.info, s2.config, cal);
  
  exampleAdvance(cal)
  
  console.table(SE1.getTable( 'finished').map((e: TeamTableItem) => e.getInterface()))
  console.table(SE2.getTable( 'finished').map((e: TeamTableItem) => e.getInterface()))

  globalFinishedRankingsMap.forEach((ranking: TypeRanking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.table.map((e: RankItem) => {return {...e, team: e.team.id}}));
    }
  })
  
}