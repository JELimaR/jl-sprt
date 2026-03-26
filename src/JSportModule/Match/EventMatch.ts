import { IJEventInfo, JEvent } from "../../JCalendar/Event/JEvent";
import { A_Match } from "./A_Match";
import { IVolleyScore } from "../profiles/volleyball/VolleyScore";

export interface IJEventMatchInfo extends IJEventInfo {
  match: A_Match<any>;
}

export class JEventMatch extends JEvent {
  // evento que dura algunos intervalos
  private _match: A_Match<any>;
  constructor(emc: IJEventMatchInfo) {
    try {
      super(emc);
      this._match = emc.match;
    } catch (error) {
      console.log(emc)
      throw error
    }
  }

  private formatScore(score: number | IVolleyScore): string {
    // Si es un número (Fútbol, Basket, etc.)
    if (typeof score === 'number') {
      return score.toString().padStart(2, ' ');
    }
  
    // Si es Volleyball: "Sets (Puntos por set)"
    const sets = score.setsWon;
    const points = score.setPoints.join(' | ');
    return `${sets} Sets (${points})`;
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
    console.log(`\t  ${this._match.homeTeam.id.padEnd(10)} : ${this.formatScore(res.teamOneScore.score)}`);
    console.log(`\t  ${this._match.awayTeam.id.padEnd(10)} : ${this.formatScore(res.teamTwoScore.score)}`);
  }
}