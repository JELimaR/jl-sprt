import { IJEventInfo, JEvent } from "../../JCalendar/Event/JEvent";
import { A_Match } from "./A_Match";

export interface IJEventMatchInfo extends IJEventInfo {
  match: A_Match<unknown>;
}

export class JEventMatch extends JEvent {
  // evento que dura algunos intervalos
  private _match: A_Match<unknown>;
  constructor(emc: IJEventMatchInfo) {
    try {
      super(emc);
      this._match = emc.match;
    } catch (error) {
      console.log(emc)
      throw error
    }
  }

  execute(): void {
    this._match.start();
    console.log(`playing match ${this._match.id}`);
    while (this._match.state !== 'finished') {
      this._match.advance();
    }
    console.log(`\tresult:`)
    const res = this._match.result;
    if (!res) throw new Error(`no se obtuvo un res`)
    console.log(`\t\t ${this._match.homeTeam.id}: ${res.teamOneScore.score}`);
    console.log(`\t\t ${this._match.awayTeam.id}: ${res.teamTwoScore.score}`);
  }
}