import { IJEventInfo, JEvent } from "../../Calendar/Event/JEvent";
import JMatch from "./JMatch";

export interface IJEventMatchInfo extends IJEventInfo {
    match: JMatch;
}

export class JEventMatch extends JEvent {
// evento que dura algunos intervalos
	private _match: JMatch;
	constructor(emc: IJEventMatchInfo) {
			super(emc);
			this._match = emc.match;
	}

	ejecute(): void {
			this._match.start();
			console.log(`playing match ${this._match.id}`);
			while (this._match.state !== 'finished') {
					this._match.advance();
			}
			console.log(`\tresult:`)
			const res = this._match.result;
			console.log(`\t\t ${this._match.homeTeam.id}: ${res.homeScore}`);
			console.log(`\t\t ${this._match.awayTeam.id}: ${res.awayScore}`);
	}
}