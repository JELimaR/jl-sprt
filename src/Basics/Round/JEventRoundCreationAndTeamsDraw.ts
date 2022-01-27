import { IJEventOthersInfo, JEventOthers } from "../../Calendar/Event/JEvent";
import JSingleElmination from "../JSingleElmination"
import JTeam from "../JTeam";
import { arr2 } from "../types";

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
      // donde se hace sorteo?
      // hay o aplican reglas de validacion?
      const winners = this._playoff.rounds[this._playoff.rounds.length - 1].winners;
      for (let i = 0; i< winners.length; i+=2) {
        teams.push([
          winners[i],winners[i+1]
        ])
      }
    }

    this._playoff.newRound(teams, this.calendar, this.dateTime)

  }
}