import * as data from './data';
import * as utlts from 'jl-utlts';
const CUF = utlts.CollectionsUtilsFunctions.getInstance();

import LB from './Basics/LB'
import { TypeHalfWeekOfYear } from './Logica/Calendar/types';
import { JCalendarLB, JEvent, JEventCreateNewLB } from './Logica/JCalendarLB';
import LBManager from './LBManager';

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

console.log('init')

const lbm: LBManager = new LBManager();

// console.log(JSON.stringify(lbm.calendar.events, null, 2));
// console.log(lbm._nextEvent);

let i = 0;
while ( lbm._nextEvent && i < 100000) {
	lbm.advance();
	const events = lbm.getEventNow();
	events.forEach((eve: JEvent, idx: number) => {
		if (eve instanceof JEventCreateNewLB ) {
			const cant: number = 10;
			const IV: boolean = true;
			let wks: TypeHalfWeekOfYear[] = [];
			for (let i=0; i < LB.getCantFchs(cant,IV); i++) {
				wks.push(4*i+12 as TypeHalfWeekOfYear);
			}
			lbm.setLB(eve.ejecute({partsNumber: cant, isIV: IV, hws: wks}));
		}
	})
	if (events.length > 0) console.log(lbm.dt)
	i++;
}


const cant: number = 10;
const IV: boolean = true;
let wks: TypeHalfWeekOfYear[] = [];

for (let i=0; i < LB.getCantFchs(cant,IV); i++) {
	wks.push(4*i+12 as TypeHalfWeekOfYear);
}

const lb = new LB({partsNumber: cant, isIV: IV, hws: wks});
let teams: string[] = CUF.shuffled(data.teams,0);
let selectedTeams = teams.slice(0,cant);

lb.assign(selectedTeams);

// console.log(JSON.stringify(lb.getFech('id', 13), null,2))


console.log()

