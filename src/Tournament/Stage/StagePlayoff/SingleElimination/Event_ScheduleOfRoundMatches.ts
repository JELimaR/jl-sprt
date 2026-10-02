import { IJEventInfo, JInstantEvent, JDateTime, TypeHalfWeekOfYear } from "jl-calendar";
import { Round } from "./Round";
import { SingleElimination } from './SingleElimination';
import { arr2, AnyMatch } from "jl-sprt-core";
import { JEventMatch } from "../../Match/EventMatch";
import { MatchScheduler } from "../../Match/MatchScheduler";


export interface IEvent_ScheduleOfRoundMatchesInfo extends IJEventInfo {
	round: Round;
	playoff: SingleElimination;
}

export class Event_ScheduleOfRoundMatches extends JInstantEvent {
	// evento que implica una configuracion necesaria
	_round: Round;
	_playoff: SingleElimination;
	constructor(efc: IEvent_ScheduleOfRoundMatchesInfo) {
		try {
			super(efc);
			this._round = efc.round;
			this._playoff = efc.playoff;
		} catch (error) {
			console.log(efc)
			throw error
		}
	}

	get kind(): string { return 'schedule'; }
	get label(): string { return `Programación ronda ${this._round.num}`; }

	/** Descripción legible para observación (logs de examples). No imprime. */
	describe(): string {
		return `programación ronda ${this._round.num}`;
	}

	advance() {
		// el evento debe crearse en el match
		const hws2: arr2<TypeHalfWeekOfYear> = this._round.halfWeek;
		this._round.series.forEach((serie) => {
			serie.matches.forEach((match: AnyMatch, idx: number) => {
				const dt: JDateTime = JDateTime.createFromHalfWeekOfYearAndYear(
					hws2[idx as 0 | 1],
					this._playoff.info.season,
					'end'
				);
				MatchScheduler(match, dt, this.calendar);
			})
		});
	}
}