import { CollectionsUtilsFunctions } from 'jl-utlts';
import JLeague, { IJLeagueConfig } from './Basics/JLeague';
import JTeam from './Basics/JTeam';
import JBombo, { IJBomboInfo } from './Basics/JBombo';
import { TypeHalfWeekOfYear } from './Calendar/DateTime/types';
import { JDateTime } from './Calendar/DateTime/JDateTime';
import { IJStageGroupInfo } from './Basics/Stage/JStageGroup';

const CUF = CollectionsUtilsFunctions.getInstance();

let teamsList: string[] = [];
for (let i = 1; i <= 700; i++) {
	teamsList.push(`T${1000 + i}`);
}
// configuracion de la fed o conf o fih
// fuente global de datos externa
// export const dataCreateLB = (): IJLeagueConfig => {
// 	const cant: number = 10;
// 	const IV: boolean = true;
// 	let wks: TypeHalfWeekOfYear[] = [];
// 	let wksass: TypeHalfWeekOfYear[] = [];
// 	for (let i = 0; i < JLeague.getCantFchs(cant, IV); i++) {
// 		const wksItem = (4 * i + 12) as TypeHalfWeekOfYear;
// 		const wksassItem = i < 4 ? 10 : ((4 * i) as TypeHalfWeekOfYear);
// 		if (wksItem <= wksassItem)
// 			throw new Error(`se debe asignar la fech antes de jugarse`);
// 		wks.push(wksItem);
// 		wksass.push(wksassItem);
// 	}
// 	return {
// 		partsNumber: cant,
// 		isIV: IV,
// 		fechHalfWeeks: wks,
// 		fechHalfWeeksSchedule: wksass,
// 		temp: 1,
// 	};
// };

export const teamSelection = (cant: number): JTeam[] => {
	let selection: string[];
	// selection = CUF.shuffled(teamsList, 0).slice(0, cant);
	selection = teamsList.slice(0, cant);
	// selection.sort();
	let teams: JTeam[] = [];
	selection.forEach((val: string) => {
		teams.push(new JTeam(val));
	})
	return teams;
};

// export const firstStageGroup = (): IJStageGroupInfo => {

// 	let out: IJStageGroupInfo = {
// 		createDate: {day: 1, interv: 0},
// 		initDate: {day: 8, interv: 0},
// 		finalDate: {day: 344, interv: 0},
// 		drawDate:{day: 7, interv: 200},
// 		groupsNumber: 3,
// 		isIV: true,
// 		participantsPerGroup: [12, 12, 11],
// 		fechHalfWeeks: [],
// 		fechHalfWeeksSchedule: [],
// 		drawRulesValidate: (groups: Array<JTeam>) => true,
// 		bombos: [
// 			{cant: 9, selectionPerTime: 0},
// 			{cant: 9, selectionPerTime: 0},
// 			{cant: 9, selectionPerTime: 0},
// 			{cant: 8, selectionPerTime: 0},
// 		],
// 		stageId: 1,
// 		participantsNumber: {
// 			news: 35,
// 			prevs: 0
// 		}
// 	}

// 	//
// 	let wks: TypeHalfWeekOfYear[] = [];
// 	let wksass: TypeHalfWeekOfYear[] = [];
// 	for (let i = 0; i < JLeague.getCantFchs(out.participantsPerGroup[0], out.isIV); i++) {
// 		const wksItem = (4 * i + 12) as TypeHalfWeekOfYear;
// 		const wksassItem = i < 4 ? 10 : ((4 * i) as TypeHalfWeekOfYear);
// 		if (wksItem <= wksassItem)
// 			throw new Error(`se debe asignar la fech antes de jugarse`);
// 		out.fechHalfWeeks.push(wksItem);
// 		out.fechHalfWeeksSchedule.push(wksassItem);
// 	}
// 	out.bombos.forEach((b: {cant: number, selectionPerTime: number}) => {
// 		b.selectionPerTime = Math.round(b.cant / out.groupsNumber);
// 	})
// 	// validar fechas

// 	// validaciones
// 	console.log(out.participantsPerGroup.length === out.groupsNumber)
// 	console.log(out.fechHalfWeeks.length === out.fechHalfWeeksSchedule.length)
// 	console.log(arrSum(out.participantsPerGroup) === arrSum(out.bombos.map((ele: {cant: number}) => ele.cant)))

// 	return out;
// }

// const arrSum = (en: number[]): number => {
// 	let out = 0;
// 	en.forEach((e: number) => { out += e });
// 	return out;
// }

// export const firstStageGroupTeamSelection = (config: IJStageGroupInfo) => {
// 	// let bombos: {cant: number, sel}[] = config.bombos; // devolver solo los teams
// 	let selection: string[];
// 	selection = teamsList.slice(0, arrSum(config.bombos.map((ele: {cant: number}) => ele.cant)));
// 	selection.sort();
// 	let teams: JTeam[] = [];
// 	selection.forEach((val: string) => {
// 		teams.push(new JTeam(val));
// 	})

// 	let i = 0;
// 	let out: JTeam[][] = [];
// 	config.bombos.forEach((b: {cant: number, selectionPerTime: number}) => {
// 		let j = i + b.cant;
// 		out.push(teams.slice(i, j))
// 		i = j;
// 	})
// 	return out;
// }
