import { JDateTime } from "../../../../Calendar/DateTime/JDateTime";
import { IJEventOthersInfo, JEventOthers } from "../../../../Calendar/Event/JEvent";
import JMatch from "../../../Match/JMatch";
import { JEventMatch } from "../../../Match/JEventMatch";
import { JRound } from "./JRound";
import { IJSingleElminationConfig } from '../JSingleElmination';
import JSerie from "../../../Match/JSerie";
import { TypeHalfWeekOfYear } from "../../../../Calendar/DateTime/types";
import { arr2 } from "../../../types";


export interface IJEventMatchsOfRoundScheduleInfo extends IJEventOthersInfo {
	round: JRound;
	config: IJSingleElminationConfig;
}
  
export class JEventMatchsOfRoundSchedule extends JEventOthers {
	// evento que implica una configuracion necesaria
	_round: JRound;
	_config: IJSingleElminationConfig;
	constructor(efc: IJEventMatchsOfRoundScheduleInfo) {
		super(efc);
		this._round = efc.round;
		this._config = efc.config;
	}

	execute() {
		console.log(`ejecuting match scheduling for Round number: ${this._round.num}`);
		// el evento debe crearse en el match
		const hws2: arr2<TypeHalfWeekOfYear> = this._round.halfWeek;
		this._round.series.forEach((serie: JSerie) => {
			serie.matches.forEach((m: JMatch, idx: number) => {
				const dt: JDateTime = JDateTime.createFromHalfWeekOfYearAndYear(
					hws2[idx as 0 | 1],
					this._config.season,
					'end'
				);
				m.schedule(dt);
				this.calendar.addEvent(
					new JEventMatch({
						dateTime: dt.getIJDateTimeCreator(),
						calendar: this.calendar,
						match: m
					})
				)
			})
		});
	}
}