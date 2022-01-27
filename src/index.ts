import { CollectionsUtilsFunctions } from 'jl-utlts';
const CUF = CollectionsUtilsFunctions.getInstance();

import JLeague, { IJLeagueConfig } from './Basics/JLeague';
import JTeam from './Basics/JTeam';
import { JDateTime } from './Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from './Calendar/DateTime/types';

// import LBManager from './LBManager';
// import GSManager from './GSManager';
import { JEvent } from './Calendar/Event/JEvent';
import { JFech } from './Basics/Fech/JFech';
import JMatch from './Basics/Match/JMatch';
import TManager from './TManager';
import JStageGroup from './Basics/Stage/JStageGroup';
import JStagePlayoff from './Basics/Stage/JStagePlayoff';
import { JRound } from './Basics/Round/JRound';
import { JRankCalculator } from './Basics/Rank/JRank';
import JStageParallels from './Basics/Stage/JStageParallels';


console.log('init');
let i: number = 0;


const tm = new TManager();
console.log(tm._calendar.events)

let dt: JDateTime = new JDateTime({day: 0, interv: 0});
while (tm.getNextEvent(dt)) {
	// gsm.advance();
	dt = tm.getNextEvent(dt)!.dateTime;
	
	const events = tm.getEventNow(dt);
	events.forEach((eve: JEvent, idx: number) => {
		console.log(idx);
		eve.execute();
	});
	if (events.length > 0) {
		const idt = dt.getDateTime();
		const s = `${idt.date.dayOfMonth} - ${idt.date.monthOfYear}`
		console.log(s);
		console.log('-----------------------------------------');
	}
  i++;
}

console.log(`final`)
tm._trn._stages.forEach((s: JStageParallels) => {
	console.log(`Stage`, s.info.stageId);
	console.log('qualified');
	console.table(s.oneSS!.qualified().map(t => t.id));
	console.log('rank');
	console.table(JRankCalculator.getRankStageParallel(s).table);
	// if (s.one instanceof JStageGroup) {
		// s.groups.forEach((g: JLeague) => {
		// 	console.table(g.table)
		// })
		// console.log(s.config);
	// } else if (s.one instanceof JStagePlayoff) {
		
	// }
})

// console.log(tm._trn.config.participantsRank);
// console.log(JRankCalculator.getRankStageParallel(tm._trn.stages.get(1)!));
// console.log(tm._trn.stages.get(2)!.one.qualified().map(t => t.id));

console.log(tm._trn.stages.length);
// console.table(tm._trn._stages[0].rank)

/*

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

// gsm.sg?._groups.forEach((g: JLeague) => {
// 	g.teams.forEach((t: JTeam) => {
// 		if (t.id === 'T1001') {
// 			let printer: string, points: number, sum: number = 0;
// 			t.matches.forEach((m: JMatch) => {
// 				if (m.result.winner === 'E')  {
// 					printer = 'E';
// 				} else if (m.homeTeam.id === t.id ) { 
// 					printer = (m.result.winner === 'L') ? 'G' : 'P'
// 				}	else {
// 					printer = (m.result.winner === 'V') ? 'G' : 'P'
// 				}
// 				switch (printer) {
// 					case 'G':
// 						points = 3;
// 						break;
// 					case'E':
// 						points = 1;
// 						break;
// 					default:
// 						points = 0;
// 						break;
// 				}
// 				sum = sum + points;
// 				console.log('res:', printer, 'points: ', points, 'sum: ', sum)
// 			})
// 		}
// 	})
// })