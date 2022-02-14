import JBombo from '../JBombo';
import JTeam from '../../JTeam';
import { IJEventInfo, JEvent } from "../../../Calendar/Event/JEvent";
import JStagePlayoff from './JStagePlayoff';
import { arr2 } from '../../types';

export interface IJEventStagePlayoffTeamsDrawInfo extends IJEventInfo {
	stagePlayoff: JStagePlayoff;
	bombos: JBombo<JTeam>[];
}

export class JEventStagePlayoffTeamsDraw extends JEvent {
	private _stagePlayoff: JStagePlayoff;
	private _bombos: JBombo<JTeam>[];
	constructor(egstd: IJEventStagePlayoffTeamsDrawInfo) {
		super(egstd);
		this._stagePlayoff = egstd.stagePlayoff;
		this._bombos = egstd.bombos
	}

	execute() {
		console.log(`ejecuting teams draw from stage: ${this._stagePlayoff.stageId}`);

		let seriesArr: arr2<JTeam>[] = [];
		let isValid: boolean = false;

		let i: number = 0;
		while (!isValid && i >= 0 && i < 1000000) {
			this._bombos.forEach((b: JBombo<JTeam>) => b.reset());
			seriesArr = this.draw();
			isValid = true;
			seriesArr.forEach((ser: arr2<JTeam>) => {
				if (!this._stagePlayoff.drawRulesValidate(ser)) isValid = false;
			})
			i++;
		}

		this._stagePlayoff.playoff.assign(seriesArr, this.calendar);
		console.log('end teams draw');
	}

	private draw(): arr2<JTeam>[] {
		let out: arr2<JTeam>[] = [];

		let list: JTeam[] = [];
		this._bombos.forEach((b: JBombo<JTeam>) => {
			let elements: JTeam[] = b.getElements();
			while (elements.length > 0) {
				if (elements.length !== 1) throw new Error(`se debe seleccionar exactamente un elemento del bombo.
				funcion draw de JEventStagePlayoffTeamsDraw`)
				list.push(elements[0]);
				elements = b.getElements();
			}
		})

		const total = list.length;
		for (let i = 0; i < total / 2; i++) {
			out.push(
				[list[total - i - 1], list[i]]
			)
		}

		if (list.length % 2 !== 0) throw new Error(`list.length ${list.length}`)
		if (list.length / 2 !== out.length)
			throw new Error(`list.length / 2 ${list.length / 2} debe ser igual a out.length ${out.length}
		en funcion draw de JEventStagePlayoffTeamsDraw`)
		return out;
	}
}