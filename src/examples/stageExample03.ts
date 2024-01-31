import JCalendar from "../JCalendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import mostrarFecha from "../mostrarFechaBorrar";
import exampleAdvance from "./exampleAdvance";
import stageExampleData from "./stageExampleData";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import StageGroup from "../Tournament/Stage/StageGroup/StageGroup";
import {  TGS } from "../Tournament/types";
import StagePlayoff from "../Tournament/Stage/StagePlayoff/StagePlayoff";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import { IElementInfo, IRankItem, IStageConfig, IStageGroupConfig, IStagePlayoffConfig, Ranking } from "../JSportModule";
import Team from "../JSportModule/data/Team";
import TeamTableItem from "../JSportModule/Ranking/TeamTableItem";

const {
  s1,
  s3,
} = stageExampleData;
const selection = getExampleTeams(150, 'Team');

const stages: TGS[] = [];

export default function stageExample03() {

  const rankItemArr: IRankItem[] = selection.map((t: Team, i: number) => { return { pos: i + 1, team: t, origin: 'rankingInicial' } });
  const ranking: Ranking = Ranking.fromRankItemArr('rankingInicial', rankItemArr);
  globalFinishedRankingsMap.set(ranking.context, ranking);
  
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());
  mostrarFecha(cal.now)
  
  // const SE1 = new StagePlayoff(s1.info, s1.config, cal);
  const SE1 = create(s1.info, s1.config, cal);
  stages.push(SE1);
  
  const SE3 = create(s3.info, s3.config, cal);
  stages.push(SE3);
  
  exampleAdvance(cal)

  stages.forEach((s: TGS) => {
    if (s instanceof StagePlayoff)
    console.table(SE1.getTable( 'finished').map((e: TeamTableItem) => e.getInterface()))
    else if (s instanceof StageGroup) {
      console.table(SE3.getTable( 'finished').map((e: TeamTableItem) => e.getInterface()))
    }
  })
  

  globalFinishedRankingsMap.forEach((ranking: Ranking, key: string) => {
    if (key !== 'rankingInicial') {
      console.table(ranking.getRankTable().map((e: IRankItem) => {return {...e, team: e.team.id}}));
    }
  })

  // console.log(stages)
  
}

function create(info: IElementInfo, config: IStageConfig, cal: JCalendar): TGS {
  // throw new Error(`sdfg  dsfg dfsg dsfg`)
    if (config.type == 'group') {
      const sconfig = config as IStageGroupConfig;
      return new StageGroup(info, sconfig, cal);
    } else if (config.type == 'playoff') {
      const sconfig = config as IStagePlayoffConfig;
      return new StagePlayoff(info, sconfig, cal);
    } else {
      throw new Error(`not implemented. (en StageConstructor)`)
    }
  }