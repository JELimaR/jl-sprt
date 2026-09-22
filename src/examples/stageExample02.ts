
import { JCalendar, JDateTime } from "jl-calendar";
import { getExampleTeams } from "./ExampleData";
import StageGroup from "../Tournament/Stage/StageGroup/StageGroup";
import { mostrarFecha } from "../mostrarFechaBorrar";
import { AdvanceAll } from '../Tournament/Advance';
import stageExampleData from "./stageExampleData";
import { SimulationContext } from "../Tournament/SimulationContext";
import { Team } from "../jl-sprt-core";
import { IRankItem, TypeRanking, Ranking } from "../JSportModule";
import { FootballProfile } from "../jl-sprt-match/football/FootballProfile";

const {
  s3,
  s4,
} = stageExampleData;
const selection = getExampleTeams(150, 'Team');

export default function stageExample02() {

  const cal = JCalendar.createFromYear(1986);
  const ctx = new SimulationContext(cal);

  const rankItemArr: IRankItem[] = selection.map((t: Team, i: number) => { return { pos: i + 1, team: t, origin: 'rankingInicial' } });
  const ranking: TypeRanking = { context: 'rankingInicial', items: rankItemArr, teams: rankItemArr.map(e => e.team) }
  ctx.store.set(ranking.context, Ranking.fromTypeRanking(ranking));

  mostrarFecha(cal.now)

  const SE3 = new StageGroup(s3.info, s3.config, ctx, new FootballProfile());
  const SE4 = new StageGroup(s4.info, s4.config, ctx, new FootballProfile());

  AdvanceAll(cal)
  // console.log(cal.events[cal.events.length-1])

  console.table(SE3.getTable('finished').map(e => e.getInterface()))
  console.table(SE4.getTable('finished').map(e => e.getInterface()))

  console.log(SE3.groups.map(l => {
    return l.teamsArr.map((t => t.id))
  }))

  console.log(SE4.groups.map(l => {
    console.table(l.getTable('partial').map(e => e.getInterface()))
    return l.teamsArr.map((t => t.id))
  }))

  ctx.store.forEach((ranking: Ranking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.getRankTable().map((e: IRankItem) => { return { ...e, team: e.team.id } }));
    }
  })

}