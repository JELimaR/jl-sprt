import JCalendar from "../JCalendar/JCalendar";
import { getExampleTeams } from "./ExampleData";
import StagePlayoff from "../Tournament/Stage/StagePlayoff/StagePlayoff";
import mostrarFecha from "../mostrarFechaBorrar";
import exampleAdvance from "./exampleAdvance";
import stageExampleData from "./stageExampleData";
import { globalFinishedRankingsMap } from "../Tournament/globalFinishedRankingsMap";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import Team from "../JSportModule/data/Team";
import { IRankItem, TypeRanking, Ranking } from "../JSportModule";
import { FootballProfile } from "../JSportModule/profiles/FootballProfile";

const {
  s1,
  s2,
} = stageExampleData;
const selection = getExampleTeams(150, 'Team');

export default function stageExample01() {

  const rankItemArr: IRankItem[] = selection.map((t: Team, i: number) => { return {pos: i+1, team: t, origin: 'rankingInicial'} });
  const ranking: TypeRanking = { context: 'rankingInicial', items: rankItemArr, teams: rankItemArr.map(e => e.team) }
  globalFinishedRankingsMap.set(ranking.context, Ranking.fromTypeRanking(ranking));
  
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)
  
  const SE1 = new StagePlayoff(s1.info, s1.config, cal, new FootballProfile());
  
  const SE2 = new StagePlayoff(s2.info, s2.config, cal, new FootballProfile());
  
  exampleAdvance(cal)
  
  console.table(SE1.getTable( 'finished').map(e => e.getInterface()))
  console.table(SE2.getTable( 'finished').map(e => e.getInterface()))

  globalFinishedRankingsMap.forEach((ranking: Ranking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.getRankTable().map((e: IRankItem) => {return {...e, team: e.team.id}}));
    }
  })
  
}