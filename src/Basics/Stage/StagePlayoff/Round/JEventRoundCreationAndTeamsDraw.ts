import { IJEventOthersInfo, JEventOthers } from "../../../../Calendar/Event/JEvent";
import JSingleElmination from "../JSingleElmination"
import JTeam from "../../../JTeam";
import { arr2 } from "../../../types";

export interface IJEventRoundCreationAndTeamsDrawInfo extends IJEventOthersInfo {
  playoff: JSingleElmination;
  teams?: arr2<JTeam>[];
}

/* acá se generan las rounds */

export default class JEventRoundCreationAndTeamsDraw extends JEventOthers {
  private _playoff: JSingleElmination;
  private _teams?: arr2<JTeam>[];
  constructor(ertd: IJEventRoundCreationAndTeamsDrawInfo) {
    super(ertd);
    this._playoff = ertd.playoff;
    this._teams = ertd.teams;
  }

  execute(): void {

    if (!this._teams && this._playoff.rounds.length === 0)
      throw new Error(`teams presentados ${this._teams} && ronda anterior: ${this._playoff.rounds.length}`)


    let teams: arr2<JTeam>[] = [];
    if (!!this._teams) {
      teams = this._teams
    } else {
      const winners = this._playoff.getLastRoundWinners();
      teams = this.draw(winners)
    }
    
    this._playoff.newRound(teams, this.calendar, this.dateTime)
    
  }
  
  private draw(list: JTeam[]): arr2<JTeam>[] {
    // donde se hace sorteo?
    let out: arr2<JTeam>[] = [];
    
    const total = list.length;
    for (let i = 0; i < total / 2; i++) {
			out.push(
				[list[total - i - 1], list[i]]
			)
		}

    return out;
  }
}