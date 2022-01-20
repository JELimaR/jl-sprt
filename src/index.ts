import { CollectionsUtilsFunctions } from 'jl-utlts';
const CUF = CollectionsUtilsFunctions.getInstance();

import LB, { ILBConfig } from './Basics/LB';
import { JDateTime } from './Logica/DateTimeClasses/JDateTime';
import { TypeHalfWeekOfYear } from './Logica/DateTimeClasses/types';
import {
  JEventCreateNewLB,
} from './Logica/JCalendarLB';
import LBManager from './LBManager';
import { JEvent } from './Logica/Event/JEvent';

/*
const sch = data.scheduling(6, true);

for (let f=0; f<sch.length;f++) {
	console.log();
	let fs: string = ``;
	for (let m=0; m<sch[f].length;m++) {
		fs = `${fs}${sch[f][m][0]}-${sch[f][m][1]} `;
	}
	console.log(fs)
}
*/

console.log('init');

const lbm: LBManager = new LBManager();
console.log(lbm.dt);
console.log(lbm.dt.getDateTime());

// console.log(JSON.stringify(lbm.calendar.events, null, 2));
// console.log(lbm._nextEvent);

let i = 0;
while (lbm.nextEvent /*&& i < 100000*/) {
	// lbm.advance();
	lbm.dt = lbm.nextEvent!.dateTime;
	// if (i>20 && i<50) console.log(lbm.lb);
	const events = lbm.getEventNow();
	events.forEach((eve: JEvent, idx: number) => {
		if (eve instanceof JEventCreateNewLB) {
			lbm.setLB(eve.ejecute());
		} else {
			eve.ejecute();
		}
	});
	if (events.length > 0) {
		const idt = lbm.dt.getDateTime();
		const s = `${idt.date.dayOfMonth} - ${idt.date.monthOfYear}`
		console.log(s);
		console.log('-----------------------------------------');
	}
  i++;
}

let fid: number = 2;
console.log(`hasta la fecha ${fid}`)
lbm.lb!.getTableFech(fid).forEach((team) => {
	console.log(JSON.stringify(team, null, 0))
})
console.log('-----------------------------------------');
fid = 8;
console.log(`hasta la fecha ${fid}`)
lbm.lb!.getTableFech(fid).forEach((team) => {
	console.log(JSON.stringify(team, null, 0))
})
fid = 11;
console.log(`hasta la fecha ${fid}`)
lbm.lb!.getTableFech(fid).forEach((team) => {
	console.log(JSON.stringify(team, null, 0))
})
console.log('-----------------------------------------');
console.log('final')
lbm.lb!.table.forEach((team) => {
	console.log(JSON.stringify(team, null, 0))
})





/*
const cant: number = 10;
const IV: boolean = true;
let wks: TypeHalfWeekOfYear[] = [];

for (let i=0; i < LB.getCantFchs(cant,IV); i++) {
	wks.push(4*i+12 as TypeHalfWeekOfYear);
}
const lb = new LB({partsNumber: cant, isIV: IV, hws: wks, temp: 89});
let teams: string[] = CUF.shuffled(data.teams,0);
let selectedTeams = teams.slice(0,cant);

lb.assign(selectedTeams);
*/
// console.log(JSON.stringify(lb.getFech('id', 13), null,2))

// console.log(lb);
/*
[1, 2, 3, 8, 7, 84, 123, 100, 101, 106, 107, 108].forEach( (value: number) => {
	console.log(value, JDateTime.halfWeekOfYearToDaysOfYear(value as TypeHalfWeekOfYear));
});
*/
