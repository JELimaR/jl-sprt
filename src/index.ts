import { CollectionsUtilsFunctions } from 'jl-utlts';
const CUF = CollectionsUtilsFunctions.getInstance();

import JLeague, { IJLeagueConfig } from './Basics/JLeague';
import JTeam from './Basics/JTeam';
import { JDateTime } from './Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from './Calendar/DateTime/types';
import LBManager from './LBManager';
import GSManager from './GSManager';
import { JEvent } from './Calendar/Event/JEvent';

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
		eve.ejecute();
	});
	if (events.length > 0) {
		const idt = lbm.dt.getDateTime();
		const s = `${idt.date.dayOfMonth} - ${idt.date.monthOfYear}`
		console.log(s);
		console.log('-----------------------------------------');
	}
  i++;
}

[2, 4, 8, 11, 14].forEach((fid: number) => {
	console.log(`hasta la fecha ${fid}`)
	console.table(lbm.lb!.getTableFech(fid))
	console.log('-----------------------------------------');
})

console.log(`final`)
console.table(lbm.lb!.table)



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
/*
import JStage, {JStagePlayOff} from './JStage';

const partsNumber = 23;
console.log('parts', partsNumber)
console.log('rounds', JStagePlayOff.maxNumberRound(partsNumber));
console.log('winners', JStagePlayOff.winnersInMaxNumberRound(partsNumber));
*/
const gsm = new GSManager();
console.log(gsm.calendar.events)


while (gsm.nextEvent && i < 100000) {
	// gsm.advance();
	gsm.dt = gsm.nextEvent!.dateTime;
	
	const events = gsm.getEventNow();
	events.forEach((eve: JEvent, idx: number) => {
		eve.ejecute();
	});
	if (events.length > 0) {
		const idt = gsm.dt.getDateTime();
		const s = `${idt.date.dayOfMonth} - ${idt.date.monthOfYear}`
		console.log(s);
		console.log('-----------------------------------------');
	}
  i++;
}

console.log(`final`)
gsm.sg!.groups.forEach((g: any) => {
	console.table(g.table)
})

/*
import {firstStageGroupTeamSelection} from './GlobalData';

let bombos = firstStageGroupTeamSelection([4,8]);

let groups: {
	uno: JTeam[],
	dos: JTeam[],
} = {uno: [], dos: []}

for(let g in groups) {
	bombos.forEach((b: any) => {
		b.getElements().forEach((t: JTeam) => {
			groups[g as 'uno' | 'dos'].push(t)
		})
	})
}

console.log(groups)
*/