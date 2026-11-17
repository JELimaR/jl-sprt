import { JCalendar, JDateTime } from "jl-calendar";
import { getExampleTeams } from "./ExampleData";
import { League } from "../Tournament/Stage/StageGroup/League/League";
import { SingleElimination } from "../Tournament/Stage/StagePlayoff/SingleElimination/SingleElimination";
import { mostrarFecha } from "../mostrarFechaBorrar";
import { ILeagueConfig, ISingleEliminationConfig, verifyBaseStageConfig } from "../JSportModule";
import { FootballProfile,FootballTeam } from "jl-sprt-match";
import { AdvanceAll } from '../Tournament/Advance';
import { attachExampleLogger } from "./exampleLogger";

export function baseStageExample() {

  const cal = JCalendar.createFromYear(1986);
  attachExampleLogger(cal);

  const selectionL = getExampleTeams(10, "football", 'TL') as FootballTeam[];
  const iniStats = selectionL.map(team => {return {
    i: team.id,
    A: team.attributes.attack.toFixed(2),
    D: team.attributes.defense.toFixed(2),
    L: team.attributes.learning.toFixed(2)
  }})
  const selectionC = getExampleTeams(132, "football", 'TC').slice(100, 133) as FootballTeam[];

  // league creation
  const leagueConfig: ILeagueConfig = {
    idConfig: 'L1',
    name: 'League Name',
    opt: 'neutral',
    participantsNumber: 10,

    turnHalfWeeks: [25, 26, 28, 31, 35, 37, 40, 42, 44],
    turnHalfWeeksSchedule: [9, 9, 9, 9, 9, 9, 40, 41, 42],
  };
  verifyBaseStageConfig(leagueConfig)

  const league = new League({
    id: 'L1-1',
    season: 1986,
  }, leagueConfig, new FootballProfile());

  league.assign(selectionL, cal);

  // single elimination creation
  const singleConfig: ISingleEliminationConfig = {
    idConfig: 'C1',
    name: 'Cup',
    opt: 'home',
    participantsNumber: 32,
    roundsNumber: 5,

    roundHalfWeeks: [[62, 63], [68, 69], [72, 74], [76, 79], [82, 84]],
    roundHalfWeeksSchedule: [56, 63, 70, 75, 80]
  }
  verifyBaseStageConfig(singleConfig);
  const singleElimination = new SingleElimination(
    {
      id: 'C',
      season: 1986
    }, singleConfig, new FootballProfile());

  singleElimination.assign(selectionC, cal);

  mostrarFecha(cal.now)

  AdvanceAll(cal);

  console.log(cal.events.length);

  console.table(league.getTable('finished').map(e => e.getInterface()))
  console.table(singleElimination.getTable('finished').map(e => e.getInterface()))

  const finStats = selectionL.map(team => {return {
    i: team.id,
    A: team.attributes.attack.toFixed(2),
    D: team.attributes.defense.toFixed(2),
    L: team.attributes.learning.toFixed(2)
  }})

  console.log('--------------------------------')
  console.table(iniStats)
  console.log('--------------------------------')
  console.table(finStats)

}
