import { IJEventOthersInfo, JEventOthers } from "../../../../Calendar/Event/JEvent";
import SingleElmination from "./SingleElmination"
import Team from "../../../Team";

export interface IEvent_RoundCreationAndTeamsDrawInfo extends IJEventOthersInfo {
  playoff: SingleElmination;
}

/* Evento en el cual se generan las rounds y se definen los teams de la siguiente ronda */
export default class Event_RoundCreationAndTeamsDraw extends JEventOthers {
  private _playoff: SingleElmination;
  
  constructor(erctdi: IEvent_RoundCreationAndTeamsDrawInfo) {
    super(erctdi);
    this._playoff = erctdi.playoff;
  }

  execute(): void {
    const thisRoundNumber = this._playoff.rounds.length + 1;
    console.log(`ejecuting creation of Round number: ${thisRoundNumber}, from: ${this._playoff.info.id}`);

    const winners = this.getLastRoundWinners();
    const teams: Team[] = SingleElmination.teamsSortForDraw(winners);
    
    this._playoff.createNewRound(teams, this.calendar/*, this.dateTime*/)
  }
  
  // si no hay ronda previa, se deben emparejar los teams participantes
  private getLastRoundWinners(): Team[] {
    const len = this._playoff.rounds.length;
    if (len == 0) {
      return this._playoff.teamsArr
    }
    return this._playoff.rounds[len - 1].winners;
  }
}