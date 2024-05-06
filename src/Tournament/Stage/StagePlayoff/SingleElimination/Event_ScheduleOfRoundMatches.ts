import { IJEventInfo, JEvent } from "../../../../JCalendar/Event/JEvent";
import { Round } from "./Round";
import SingleElmination from './SingleElmination';
import { arr2 } from '../../../../JSportModule';
import { JDateTime, TypeHalfWeekOfYear } from "../../../../JCalendar/JDateTimeModule";
import JSerie from "../../../../JSportModule/Match/JSerie";
import Match from "../../../../JSportModule/Match/JMatch";
import { JEventMatch } from "../../../../JSportModule/Match/JEventMatch";


export interface IEvent_ScheduleOfRoundMatchesInfo extends IJEventInfo {
	round: Round;
	playoff: SingleElmination;
}
  
export class Event_ScheduleOfRoundMatches extends JEvent {
	// evento que implica una configuracion necesaria
	_round: Round;
	_playoff: SingleElmination;
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

	execute() {
		console.log(`ejecuting match scheduling for Round number: ${this._round.num}`);
		// el evento debe crearse en el match
		const hws2: arr2<TypeHalfWeekOfYear> = this._round.halfWeek;
		this._round.series.forEach((serie: JSerie) => {
			serie.matches.forEach((m: Match, idx: number) => {
				const dt: JDateTime = JDateTime.createFromHalfWeekOfYearAndYear(
					hws2[idx as 0 | 1],
					this._playoff.info.season,
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