import { IJEventOthersInfo, JEventOthers } from "../../../../Calendar/Event/JEvent";
import SingleElmination from "../SingleElmination"
import Team from "../../../Team";
import { arr2 } from "../../../types";

export interface IEvent_RoundCreationAndTeamsDrawInfo extends IJEventOthersInfo {
  playoff: SingleElmination;
  teams?: Team[];
}

/* acá se generan las rounds */

export default class Event_RoundCreationAndTeamsDraw extends JEventOthers {
  private _playoff: SingleElmination;
  private _teams?: Team[];
  constructor(ertd: IEvent_RoundCreationAndTeamsDrawInfo) {
    super(ertd);
    this._playoff = ertd.playoff;
    this._teams = ertd.teams;
  }

  execute(): void {

    if (!this._teams && this._playoff.rounds.length === 0)
      throw new Error(`teams presentados ${this._teams} && ronda anterior: ${this._playoff.rounds.length}`)

    let teams: Team[] = [];
    if (!!this._teams) {
      teams = this._teams
    } else {
      const winners = this._playoff.getLastRoundWinners();
      teams = this.draw(winners)
    }
    
    this._playoff.newRound(teams, this.calendar, this.dateTime)
    
  }
  
  private draw(list: Team[]): Team[] {
    // donde se hace sorteo?
    let out: Team[] = [];
    
    const total = list.length;
    for (let i = 0; i < total/2; i++) {
			out.push(
				list[total - i - 1], list[i]
			)
		}

    return out;
  }
}