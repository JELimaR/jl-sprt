// import { CollectionsUtilsFunctions } from 'jl-utlts';
// const CUF = CollectionsUtilsFunctions.getInstance();

import League from './Basics/Stage/StageGroup/League';
import SingleElmination from './Basics/Stage/StagePlayoff/SingleElmination';
import { JDateTime } from './Calendar/DateTime/JDateTime';
import { JEvent } from './Calendar/Event/JEvent';
import JCalendar from './Calendar/JCalendar';
import { getExampleTeams } from './Entities/ExampleData';
import TManager from './TManager';

const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());

const selection = getExampleTeams(6)

// league creation
const league = new League({
  id: 'L1-1',
  name: 'League Name',
  season: 1986,
}, {
  idConfig: 'L1',
  isIV: false,
  isNeutral: true,
  participantsNumber: 6,

  turnHalfWeeks: [25, 26, 28, 31, 35],
  turnHalfWeeksSchedule: [9, 9, 9, 9, 9],
});

league.assign(selection, cal);

// single elimination creation
const singleElimination = new SingleElmination(
  {
    id: 'C',
    name: 'Cup 1',
    season: 1986
  },
  {
    idConfig: 'C1',
    isIV: true,
    isNeutral: false,
    participantsNumber: 8,
    roundsNumber: 3,
    roundHalfWeeks: [[62, 63], [68, 69], [72,74]],
    roundHalfWeeksSchedule: [40, 65, 70]
  }
);

singleElimination.assign(getExampleTeams(14).slice(6,14), cal)

const mostrarFecha = (dt: JDateTime) => {
  const { date: {
    dayOfMonth, monthName, dayName, year
  } } = dt.getDateTime()
  console.log(dayName, dayOfMonth, monthName, year)
}

mostrarFecha(cal.now)

let idx: number = 0;
while (idx < cal.events.length) {
  console.log(idx);

  const eve = cal.events[idx];
  eve.execute();
  mostrarFecha(eve.dateTime);
  idx++;
}

console.log(cal.events.length);

console.table(league.table)
console.table(singleElimination.table)
// console.log(JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 1).getDateTime())
// console.log(JDateTime.createFromHalfWeekOfYearAndYear(90, 1, 'start', 1).getIJDateTimeCreator())