import JCalendar from "../JCalendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import StagePlayoff from "../Tournament/Stage/StagePlayoff/StagePlayoff";
import mostrarFecha from "../mostrarFechaBorrar";
import exampleAdvance from "./exampleAdvance";
import stageExampleData from "./stageExampleData";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import { IRankItem } from "../JSportModule/data/Ranking/interfaces";
import { Ranking, TypeRanking } from "../JSportModule/data/Ranking/Ranking";
import Team from "../JSportModule/data/Team";
import TeamTableItem from "../JSportModule/data/Ranking/TeamTableItem";

const {
  s1,
  s2
} = stageExampleData;
const selection = getExampleTeams(150, 'Team');

export default function stageExample01() {

  const rankItemArr: IRankItem[] = selection.map((t: Team, i: number) => { return {pos: i+1, team: t, origin: 'rankingInicial'} });
  const ranking: TypeRanking = { context: 'rankingInicial', items: rankItemArr, teams: rankItemArr.map(e => e.team) }
  globalFinishedRankingsMap.set(ranking.context, Ranking.fromTypeRanking(ranking));
  
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)
  
  const SE1 = new StagePlayoff(s1.info, s1.config, cal);
  
  const SE2 = new StagePlayoff(s2.info, s2.config, cal);
  
  exampleAdvance(cal)
  
  console.table(SE1.getTable( 'finished').map((e: TeamTableItem) => e.getInterface()))
  console.table(SE2.getTable( 'finished').map((e: TeamTableItem) => e.getInterface()))

  globalFinishedRankingsMap.forEach((ranking: Ranking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.getRankTable().map((e: IRankItem) => {return {...e, team: e.team.id}}));
    }
  })
  
}