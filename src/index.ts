// import { CollectionsUtilsFunctions } from 'jl-utlts';
// const CUF = CollectionsUtilsFunctions.getInstance();

import { JDateTime } from './Calendar/DateTime/JDateTime';

import { JEvent } from './Calendar/Event/JEvent';

import TManager from './TManager';
import { JRankCalculator, JRankItem } from './Basics/Rank/JRank';
import JStageParallels from './Basics/Stage/JStageParallels';
import JStageGroup from './Basics/Stage/StageGroup/JStageGroup';
import JLeague from './Basics/Stage/StageGroup/JLeague';
import JStagePlayoff from './Basics/Stage/StagePlayoff/JStagePlayoff';
import JTeam from './Basics/JTeam';
import JMatch from './Basics/Match/JMatch';
import { JEventCreator } from './Calendar/Event/JEventCreator';



console.log('init');
let i: number = 0;


const tm = new TManager();
console.log(tm._calendar.events.map((eve: JEvent) => {
	if (eve instanceof JEventCreator) {
		return new JDateTime(eve.dateTime.getIJDateTimeCreator())
	}
}))

let dt: JDateTime = new JDateTime({ day: 0, interv: 0 });
while (tm.getNextEvent(dt)) {
	// gsm.advance();
	dt = tm.getNextEvent(dt)!.dateTime;
	if (tm._calendar.events.length === 6) {
		console.log(tm._calendar.events.map((eve: JEvent) => {
			return JSON.stringify({dt: new JDateTime(eve.dateTime.getIJDateTimeCreator())}, null, 2)

		}))
	}

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
	if (s.oneSS instanceof JStageGroup) {
		s.oneSS.groups.forEach((g: JLeague) => {
			console.table(g.table)
		})
		// console.log(s.config);
	} else if (s.oneSS instanceof JStagePlayoff) {

	}
	console.table(s.oneSS?.relativeTable);
	console.log('rank');
	console.table(JRankCalculator.getRankStageParallel(s).table);
})

// console.log(tm._trn.config.participantsRank);
// console.log(JRankCalculator.getRankStageParallel(tm._trn.stages.get(1)!));
// console.log(tm._trn.stages.get(2)!.one.qualified().map(t => t.id));

console.log(tm._trn.stages.length);

const TID: string = tm._trn.rank.table[0].team.id;
console.log(TID);

let arrTeamsPoints: { team: string, rank: number, points: number, matchNumber: number, pointsAvg: string }[] = [];

tm._trn.rank.table.forEach((item: JRankItem) => {
	const team: JTeam = item.team;
	let printer: string, points: number, sum: number = 0;
	team.matches.forEach((m: JMatch) => {
		if (m.result!.teamWinner === 'none') {
			printer = 'E';
			points = 1;
		} else if (m.result!.teamWinner === team.id) {
			printer = 'G'
			points = 3;
		} else {
			printer = 'P'
			points = 0;
		}
		sum = sum + points;
		if (TID === team.id) console.log('res:', printer, 'points: ', points, 'sum: ', sum)
	})
	arrTeamsPoints.push({
		team: team.id,
		points: sum,
		rank: item.rank,
		matchNumber: team.matches.length,
		pointsAvg: (sum / team.matches.length).toLocaleString('de-DE')
	})
})

console.table(arrTeamsPoints);
