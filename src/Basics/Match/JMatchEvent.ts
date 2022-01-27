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

	execute(): void {
			this._match.start();
			console.log(`playing match ${this._match.id}`);
			while (this._match.state !== 'finished') {
					this._match.advance();
			}
			console.log(`\tresult:`)
			const res = this._match.result;
			const global = this._match.serie?.result;
			const homeGlobal = global?.getScore(this._match.homeTeam.id)
			const awayGlobal = global?.getScore(this._match.awayTeam.id)
			if (!res) throw new Error(`no se obtuvo un res`)
			console.log(`\t\t ${this._match.homeTeam.id}: ${res.teamOneScore.score}${(global) ? ' ' + homeGlobal : ''}`);
			console.log(`\t\t ${this._match.awayTeam.id}: ${res.teamTwoScore.score}${(global) ? ' ' + awayGlobal : ''}`);
	}
}