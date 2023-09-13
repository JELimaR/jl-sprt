import { JDateTime } from "../Calendar/DateTime/JDateTime";
import JCalendar from "../Calendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import { JRankCalculator, JRankItem } from "../Tournament/Rank/JRank";
import Stage, {  TYPEGENERICSTAGE } from "../Tournament/Stage/Stage";
import StagePlayoff from "../Tournament/Stage/StagePlayoff/StagePlayoff";
import Team from "../Tournament/Team";
import mostrarFecha from "../mostrarFechaBorrar";
import exampleAdvance from "./exampleAdvance";
import stageExampleData from "./stageExampleData";

const {
  s1,
  s2
} = stageExampleData;
const selection = getExampleTeams(150, 'Team');
export const globalRanksMap = new Map<string, JRankItem[]>();

export default function stageExample() {

  const ranking: JRankItem[] = selection.map((t: Team, i: number) => { return {rank: i+1, team: t} })
  globalRanksMap.set('rankingInicial', ranking);
  
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)
  const stagesMap = new Map<string, TYPEGENERICSTAGE>();
  
  const SE1 = new StagePlayoff(s1.info, s1.config, cal);
  stagesMap.set(SE1.config.idConfig, SE1);
  
  const SE2 = new StagePlayoff(s2.info, s2.config, cal);
  stagesMap.set(SE2.config.idConfig, SE2);
  
  exampleAdvance(cal)
  
  console.table(JRankCalculator.getTableStagePlayoff(SE1))
  console.table(JRankCalculator.getTableStagePlayoff(SE2))
  // console.log(SE.config.qualifyConditions);
  
  // console.log(cal.events.length)
  
  // console.log(SE.halfWeekOfMatches())
  // console.log(SE)
  
}

const getQuilifies = (mapStages: Map<string, TYPEGENERICSTAGE>, stage: TYPEGENERICSTAGE): Team[] => {
  const out: Team[] = [];
  selection.slice(1, s1.config.playoff.participantsNumber).forEach((t: Team) => out.push(t))
  return out;
}