import { JCalendar, JDateTime } from "jl-calendar";
import { getExampleTeams } from "./ExampleData";
import League from "../Tournament/Stage/StageGroup/League/League";
import SingleElmination from "../Tournament/Stage/StagePlayoff/SingleElimination/SingleElmination";
import mostrarFecha from "../mostrarFechaBorrar";
import { ILeagueConfig, ISingleElminationConfig, verifyBaseStageConfig } from "../JSportModule";
import { AmericanFootballProfile } from "../JSportModule/profiles/americanFootball/AmericanFootballProfile";

/**
 * Ejemplo de BaseStage usando AmericanFootballProfile.
 * Espejo de volleyBaseStageExample, pero con el profile de American Football.
 */
export default function americanFootballBaseStageExample() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());

  const selectionL = getExampleTeams(10, 'AFL');
  const selectionC = getExampleTeams(132, 'AFC').slice(100, 133);

  // league creation
  const leagueConfig: ILeagueConfig = {
    idConfig: 'AFL1',
    name: 'American Football League',
    opt: 'neutral',
    participantsNumber: 10,

    turnHalfWeeks: [25, 26, 28, 31, 35, 37, 40, 42, 44],
    turnHalfWeeksSchedule: [9, 9, 9, 9, 9, 9, 40, 41, 42],
  };
  verifyBaseStageConfig(leagueConfig);

  const league = new League({
    id: 'AFL1-1',
    season: 1986,
  }, leagueConfig, new AmericanFootballProfile());

  league.assign(selectionL, cal);

  // single elimination creation
  const singleConfig: ISingleElminationConfig = {
    idConfig: 'AFC1',
    name: 'American Football Cup',
    opt: 'home',
    participantsNumber: 32,
    roundsNumber: 5,

    roundHalfWeeks: [[62, 63], [68, 69], [72, 74], [76, 79], [82, 84]],
    roundHalfWeeksSchedule: [56, 63, 70, 75, 80]
  };
  verifyBaseStageConfig(singleConfig);

  const singleElimination = new SingleElmination({
    id: 'AFC',
    season: 1986
  }, singleConfig, new AmericanFootballProfile());

  singleElimination.assign(selectionC, cal);

  mostrarFecha(cal.now);

  let idx: number = 0;
  while (idx < cal.events.length) {
    console.log();
    console.log(`event index: ${idx}`);

    const eve = cal.events[idx];
    eve.execute();
    mostrarFecha(eve.dateTime);
    console.log('-------------------------------------------------------------------------------------------------');
    idx++;
  }

  console.log(cal.events.length);

  console.table(league.getTable('finished').map(e => e.getInterface()));
  console.table(singleElimination.getTable('finished').map(e => e.getInterface()));
}
