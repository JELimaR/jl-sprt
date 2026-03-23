import JCalendar from "../JCalendar/JCalendar";
import { getExampleTeams } from "./ExampleData";
import League from "../Tournament/Stage/StageGroup/League/League";
import SingleElmination from "../Tournament/Stage/StagePlayoff/SingleElimination/SingleElmination";
import mostrarFecha from "../mostrarFechaBorrar";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import { ILeagueConfig, ISingleElminationConfig, verifyBaseStageConfig } from "../JSportModule";
import { VolleyballProfile } from "../JSportModule/profiles/VolleyballProfile";

/**
 * Ejemplo de BaseStage usando VolleyballProfile.
 * 
 * NOTA: Actualmente los partidos se simulan con ScoreMatch (score numérico),
 * porque la creación de matches aún no usa el ISportProfile (pendiente paso 7).
 * La tabla se crea con VolleyTeamTableItem pero updateTableFromResult no se invoca
 * correctamente hasta que Match use el profile.
 */
export default function volleyBaseStageExample() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());

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
