import JBombo from './JBombo';
import JTeam from './JTeam';
import JLeague from './JLeague';
import { IJEventInfo, JEvent } from "../Calendar/Event/JEvent";
import { JStageGroup } from '../JStage';
import { IJDateTimeCreator, JDateTime } from '../Calendar/DateTime/JDateTime';

type JLeagueTeams = Array<JTeam>;

/****** event */

export interface IJEventStageGroupTeamsDrawInfo extends IJEventInfo {
	stageGroup: JStageGroup;
	bombos: JBombo<JTeam>[];
}
  
export class JEventStageGroupTeamsDraw extends JEvent {
	// evento que implica una configuracion necesaria
	private _stageGroup: JStageGroup;
	private _bombos: JBombo<JTeam>[];
	constructor(egstd: IJEventStageGroupTeamsDrawInfo) {
		super(egstd);
		this._stageGroup = egstd.stageGroup;
		this._bombos = egstd.bombos
	}

	ejecute() {
		console.log('ejecuting teams draw');
		//let i: number = 0;
		//let list: JTeam[][] = [];
		// while ( this._stageGroup.config.drawRulesValidate(list) && i >= 0 && i < 1000000 ) {
		//i++;
		//}
		this._stageGroup.groups.forEach((group: JLeague, idx: number) => {
			let teams: JTeam[] = [];
			this._bombos.forEach((b: JBombo<JTeam>) => {
				b.getElements().forEach((t: JTeam) => {
					teams.push(t);
				})
			})
			group.assign(teams, this.calendar);
		})
		console.log('end teams draw');
	}
}