import { JCalendar, JDateTime } from "jl-calendar";
import { getExampleTeams } from "./ExampleData";
import League from "../Tournament/Stage/StageGroup/League/League";
import SingleElmination from "../Tournament/Stage/StagePlayoff/SingleElimination/SingleElmination";
import { mostrarFecha } from "../mostrarFechaBorrar";
import { ILeagueConfig, ISingleElminationConfig, verifyBaseStageConfig } from "../JSportModule";
import { VolleyballProfile } from "../jl-sprt-match/volleyball/VolleyballProfile";
import { AdvanceAll } from '../Tournament/Advance';

/**
 * Ejemplo de BaseStage usando VolleyballProfile.
 */
export default function volleyBaseStageExample() {

  const cal = JCalendar.createFromYear(1986);

  const selectionL = getExampleTeams(10, 'VL');
  const selectionC = getExampleTeams(132, 'VC').slice(100, 133);

  // league creation
  const leagueConfig: ILeagueConfig = {
    idConfig: 'VL1',
    name: 'Volleyball League',
    opt: 'neutral',
    participantsNumber: 10,

    turnHalfWeeks: [25, 26, 28, 31, 35, 37, 40, 42, 44],
    turnHalfWeeksSchedule: [9, 9, 9, 9, 9, 9, 40, 41, 42],
  };
  verifyBaseStageConfig(leagueConfig);

  const league = new League({
    id: 'VL1-1',
    season: 1986,
  }, leagueConfig, new VolleyballProfile());

  league.assign(selectionL, cal);

  // single elimination creation
  const singleConfig: ISingleElminationConfig = {
    idConfig: 'VC1',
    name: 'Volleyball Cup',
    opt: 'home',
    participantsNumber: 32,
    roundsNumber: 5,

    roundHalfWeeks: [[62, 63], [68, 69], [72, 74], [76, 79], [82, 84]],
    roundHalfWeeksSchedule: [56, 63, 70, 75, 80]
  };
  verifyBaseStageConfig(singleConfig);

  const singleElimination = new SingleElmination({
    id: 'VC',
    season: 1986
  }, singleConfig, new VolleyballProfile());

  singleElimination.assign(selectionC, cal);

  mostrarFecha(cal.now);

  AdvanceAll(cal);

  console.log(cal.events.length);

  console.table(league.getTable('finished').map(e => e.getInterface()));
  console.table(singleElimination.getTable('finished').map(e => e.getInterface()));
}
