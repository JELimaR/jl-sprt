import { IJEventInfo, JEvent } from "../../../../JCalendar/Event/JEvent";
import { Turn } from "./Turn";
import League from './League';
import { JDateTime } from "../../../../JCalendar/JDateTimeModule";
import Match from "../../../../JSportModule/Match/ScoreMatch";
import { JEventMatch } from "../../../../JSportModule/Match/EventMatch";

export interface IEvent_ScheduleOfTurnMatchesInfo extends IJEventInfo {
	turn: Turn;
	// leagueData: ITCCDATA<ILeagueInfo, ILeagueConfig>;
	league: League;
}
  
export class Event_ScheduleOfTurnMatches extends JEvent {
	// evento que implica una configuracion necesaria
	_turn: Turn;
	// _leagueData: ITCCDATA<ILeagueInfo, ILeagueConfig>
	_league: League;
	constructor(efc: IEvent_ScheduleOfTurnMatchesInfo) {
    try {
      super(efc);
      this._turn = efc.turn;
      this._league = efc.league;
    } catch(error) {
      console.log(efc)
      throw error
    }
	}

	execute() {
		console.log(`ejecuting match scheduling for matchHWeek number: ${this._turn.num}`);
		// el evento debe crearse en el match
		this._turn.matches.forEach((match: Match) => {
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