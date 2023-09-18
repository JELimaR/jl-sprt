import { JDateTime } from "../../../../Calendar/DateTime/JDateTime";
import { IJEventOthersInfo, JEventOthers } from "../../../../Calendar/Event/JEvent";
import JMatch from "../../../Match/JMatch";
import { JEventMatch } from "../../../Match/JEventMatch";
import { Turn } from "./Turn";
import League from './League';
import { ITCCDATA } from "../../../../patterns/templateConfigCreator";


export interface IEvent_ScheduleOfTurnMatchesInfo extends IJEventOthersInfo {
	turn: Turn;
	// leagueData: ITCCDATA<ILeagueInfo, ILeagueConfig>;
	league: League;
}
  
export class Event_ScheduleOfTurnMatches extends JEventOthers {
	// evento que implica una configuracion necesaria
	_turn: Turn;
	// _leagueData: ITCCDATA<ILeagueInfo, ILeagueConfig>
	_league: League;
	constructor(efc: IEvent_ScheduleOfTurnMatchesInfo) {
		super(efc);
		this._turn = efc.turn;
		// this._leagueData = efc.leagueData;
		this._league = efc.league;
	}

	execute() {
		console.log(`ejecuting match scheduling for matchHWeek number: ${this._turn.num}`);
		// el evento debe crearse en el match
		this._turn.matches.forEach((match: JMatch) => {
			const dt = JDateTime.createFromHalfWeekOfYearAndYear(
				this._turn.halfWeek,
				// this._leagueData.info.season,
				this._league.info.season,
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