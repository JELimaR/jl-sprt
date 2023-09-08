import { IJEventOthersInfo, JEventOthers } from "../../../../Calendar/Event/JEvent";
import SingleElmination from "../SingleElmination"
import Team from "../../../Team";

export interface IEvent_RoundCreationAndTeamsDrawInfo extends IJEventOthersInfo {
  playoff: SingleElmination;
}

/* Evento en el cual se generan las rounds y se definen los teams de la siguiente ronda */

export default class Event_RoundCreationAndTeamsDraw extends JEventOthers {
  private _playoff: SingleElmination;
  // private _teams?: Team[];
  constructor(ertd: IEvent_RoundCreationAndTeamsDrawInfo) {
    super(ertd);
    this._playoff = ertd.playoff;
    // this._teams = ertd.teams;
  }

  execute(): void {
    const thisRoundNumber = this._playoff.rounds.length + 1;
    console.log(`ejecuting creation of Round number: ${thisRoundNumber}, from: ${this._playoff.info.id}`);

    // if (!this._teams && this._playoff.rounds.length === 0)
    //   throw new Error(`teams presentados ${this._teams} && ronda anterior: ${this._playoff.rounds.length}`)

    // los teams de la ronda son los asignados al evento o los ganadores de la ultima ronda jugada
    let teams: Team[] = [];
    // if (!!this._teams) {
    //   teams = this._teams
    // } else {
    // }
    const winners = this.getLastRoundWinners();
    teams = SingleElmination.teamsSortForDraw(winners);
    
    this._playoff.createNewRound(teams, this.calendar, this.dateTime)
  }
  
  // private draw(list: Team[]): Team[] {
  //   let out: Team[] = [];
    
  //   const total = list.length;
  //   for (let i = 0; i < total/2; i++) {
	// 		out.push(
	// 			list[total - i - 1], list[i]
	// 		)
	// 	}

  //   return out;
  // }

  private getLastRoundWinners(): Team[] {
    const len = this._playoff.rounds.length;
    if (len == 0) {
      return this._playoff.teamsArr
    }
    return this._playoff.rounds[len - 1].winners;
  }
}