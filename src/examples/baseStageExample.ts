import { JDateTime } from "../Calendar/DateTime/JDateTime";
import JCalendar from "../Calendar/JCalendar";
import { getExampleTeams } from "../Entities/ExampleData";
import { JRankCalculator } from "../Tournament/Rank/JRank";
import League from "../Tournament/Stage/StageGroup/League";
import SingleElmination from "../Tournament/Stage/StagePlayoff/SingleElmination";
import mostrarFecha from "../mostrarFechaBorrar";

export default function baseStageExample() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());

  const selectionL = getExampleTeams(10, 'TL');
  const selectionC = getExampleTeams(132, 'TC').slice(100, 133);

  // league creation
  const league = new League({
    id: 'L1-1',
    season: 1986,
  }, {
    idConfig: 'L1',
    name: 'League Name',
    opt: 'neutral',
    participantsNumber: 10,

    turnHalfWeeks: [25, 26, 28, 31, 35, 37, 40, 42, 44],
    turnHalfWeeksSchedule: [9, 9, 9, 9, 9, 9, 9, 41, 41],
  });

  league.assign(selectionL, cal);

  // single elimination creation
  const singleElimination = new SingleElmination(
    {
      id: 'C',
      season: 1986
    },
    {
      idConfig: 'C1',
      name: 'Cup',
      opt: 'home',
      participantsNumber: 32,
      roundsNumber: 5,

      roundHalfWeeks: [[62, 63], [68, 69], [72, 74], [76, 79], [82, 84]],
      roundHalfWeeksSchedule: [56, 65, 70, 75, 80]
    }
  );

  singleElimination.assign(selectionC, cal);

  mostrarFecha(cal.now)

  let idx: number = 0;
  while (idx < cal.events.length) {
    console.log();
    console.log(`event index: ${idx}`);

    const eve = cal.events[idx];
    eve.execute();
    mostrarFecha(eve.dateTime);
    console.log('-------------------------------------------------------------------------------------------------')
    idx++;
  }

  console.log(cal.events.length);

  console.table(JRankCalculator.getTableBase(league, 'finished').map(e => e.getInterface()))
  console.table(JRankCalculator.getTableBase(singleElimination, 'finished').map(e => e.getInterface()))
}
