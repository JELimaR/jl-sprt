import JTeam from '../JTeam'
import JMatch from '../Match/JMatch';
import { IJDateTimeCreator, JDateTime } from '../../Calendar/DateTime/JDateTime';
import { IJTournamentConfig } from '../../JTournament';
import JStageGroup, { IJStageGroupInfo } from './JStageGroup';
import JStagePlayoff, { IJStagePlayoffInfo } from './JStagePlayoff';
import { TypeDateAndTimeOfYear } from '../../Calendar/DateTime/types';
import { arr2 } from '../types';
import { ITeamTableItem } from '../Rank/JTeamTableItem';
import { JRankCalculator, JRankItem } from '../Rank/JRank';
import JStageParallels from './JStageParallels';
import JBombo from '../JBombo';


export type TypeQualyPosition = {
	rankPosMin: number;
	rankPosMax: number;
}

export type TypeBomboData = { cant: number, selectionPerTime: number }

export interface IJSubStageInfo {
	createDate: IJDateTimeCreator;
	drawDate: IJDateTimeCreator;
	initDate: IJDateTimeCreator;
	finalDate: IJDateTimeCreator;
	isIV: boolean;
	bombos: TypeBomboData[];
	participantsNumber: number;
	prevQualies: TypeQualyPosition;
	rankMinValue: number;
}

export interface IJSubStageCreator {
	tournamentConfig: IJTournamentConfig;
	info: IJSubStageInfo;
	stageId: number;
}

export default abstract class JSubStage {

	_tournamentConfig: IJTournamentConfig;
	_prevStage: JStageParallels | undefined;
	_createDate: IJDateTimeCreator;
	_drawDate: IJDateTimeCreator;
	_initDate: IJDateTimeCreator;
	_finalDate: IJDateTimeCreator;
	_stageId: number;
	_isIV: boolean;
	_bombos: TypeBomboData[];
	_participantsNumber: number;
	_prevQualies: TypeQualyPosition;
	_rankMinValue: number;

	constructor(issc: IJSubStageCreator) {
		this._tournamentConfig = issc.tournamentConfig;
		this._createDate = issc.info.createDate;
		this._drawDate = issc.info.drawDate;
		this._initDate = issc.info.initDate;
		this._finalDate = issc.info.finalDate;
		this._isIV = issc.info.isIV;
		this._bombos = issc.info.bombos;
		this._participantsNumber = issc.info.participantsNumber;
		this._prevQualies = issc.info.prevQualies;
		this._rankMinValue = issc.info.rankMinValue;

		this._stageId = issc.stageId;
	}

	get prevStage(): JStageParallels | undefined { return this._prevStage }
	set prevStage(prev: JStageParallels | undefined) { this._prevStage = prev }
	/*
	update(subject: JMatch): void {
		throw new Error('Method not implemented.');
	}
	*/

	get tournamentConfig(): IJTournamentConfig { return this._tournamentConfig }
	get config(): IJSubStageInfo {
		return {
			createDate: this._createDate,
			drawDate: this._drawDate,
			initDate: this._initDate,
			finalDate: this._finalDate,
			isIV: this._isIV,
			bombos: this._bombos,
			participantsNumber: this._participantsNumber,
			prevQualies: this._prevQualies,
			rankMinValue: this._rankMinValue
		}
	}

	get stageId(): number { return this._stageId }

	abstract get relativeTable(): ITeamTableItem[];
	abstract get isFinished(): boolean;

	// abstract get rank(): any;

	abstract drawRulesValidate(teams: JTeam[] | arr2<JTeam>): boolean;

	qualified(): JTeam[] {
		let rank: JRankItem[];
		let out: JTeam[] = [];
		if (!this._prevQualies) throw new Error(`no existe criterio de clasificacion `)
		if (!this._prevStage) {
			rank = this._tournamentConfig.participantsRank
		} else {
			rank = JRankCalculator.getRankStageParallel(this._prevStage).table; // calcular el verdadero rank
		}
		rank.forEach((ri: JRankItem) => {
			if (ri.rank >= this._prevQualies!.rankPosMin && ri.rank <= this._prevQualies!.rankPosMax) {
				out.push(ri.team);
			}
		})
		return out;
	}

	getBombos(participants: JTeam[]): JBombo<JTeam>[] {
		let out: JBombo<JTeam>[] = [];
		let i: number = 0;
		this._bombos.forEach((bombConfig: TypeBomboData) => {
			let j = i + bombConfig.cant;
			out.push(new JBombo<JTeam>(participants.slice(i, j), bombConfig.selectionPerTime));
			i = j;
		})
		return out;
	}

}
