import { JDateTime } from "../../Calendar/DateTime/JDateTime";
import { IJEventOthersInfo, JEventOthers } from "../../Calendar/Event/JEvent";
import JMatch from "../Match/JMatch";
import { JEventMatch } from "../Match/JMatchEvent";
import { JFech } from "./JFech";
import { IJLeagueConfig } from '../JLeague';


export interface IJEventMatchsOfFechScheduleInfo extends IJEventOthersInfo {
	fech: JFech;
	config: IJLeagueConfig;
}
  
export class JEventMatchsOfFechSchedule extends JEventOthers {
	// evento que implica una configuracion necesaria
	_fech: JFech;
	_config: IJLeagueConfig;
	constructor(efc: IJEventMatchsOfFechScheduleInfo) {
		super(efc);
		this._fech = efc.fech;
		this._config = efc.config;
	}

	execute() {
		console.log(`ejecuting match scheduling for fech number: ${this._fech.num}`);
		// el evento debe crearse en el match
		this._fech.matches.forEach((match: JMatch) => {
			const dt = JDateTime.createFromHalfWeekOfYearAndYear(
				this._fech.halfWeek,
				this._config.temp,
				'end'
			);
			match.schedule(dt);
			this.calendar.addEvent(
				new JEventMatch({
					dateTime: dt.getIJDateTimeCreator(),
					calendar: this.calendar,
					match,
				})
			);
		});
	}
}