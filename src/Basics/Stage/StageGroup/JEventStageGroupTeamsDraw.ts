import JBombo from '../JBombo';
import JTeam from '../../JTeam';
import JLeague from './JLeague';
import { IJEventInfo, JEvent } from "../../../Calendar/Event/JEvent";
import JStageGroup from "./JStageGroup";

type JLeagueTeams = Array<JTeam>;

/****** event */

export interface IJEventStageGroupTeamsDrawInfo extends IJEventInfo {
	stageGroup: JStageGroup;
	bombos: JBombo<JTeam>[];
}
  
export class JEventStageGroupTeamsDraw extends JEvent {
	private _stageGroup: JStageGroup;
	private _bombos: JBombo<JTeam>[];
	constructor(egstd: IJEventStageGroupTeamsDrawInfo) {
		super(egstd);
		this._stageGroup = egstd.stageGroup;
		this._bombos = egstd.bombos;
	}

	execute() {
		console.log('ejecuting teams draw for stage group');
		
		let groupsTeamsArr: JTeam[][];
		let isValid: boolean = false;
		
		let i: number = 0;
		while (!isValid && i >= 0 && i < 1000000 ) {
			this._bombos.forEach((b: JBombo<JTeam>) => b.reset());
			groupsTeamsArr = this.draw();
			isValid = true;
			groupsTeamsArr.forEach((tarr: JTeam[]) => {
				if (!this._stageGroup.drawRulesValidate(tarr)) isValid = false;
			})
			i++;
		}
		this._stageGroup.groups.forEach((group: JLeague, idx: number) => {
			group.assign(groupsTeamsArr[idx], this.calendar);
		})
		console.log('end teams draw');
	}
	
	private draw(): Array<JTeam[]> {
		let out: JTeam[][] = [];
		this._stageGroup.groups.forEach(() => {
			let teams: JTeam[] = [];
			this._bombos.forEach((b: JBombo<JTeam>) => {
				b.getElements().forEach((t: JTeam) => {
					teams.push(t);
				})
			})
			out.push(teams);
		})
		return out;
	}
}