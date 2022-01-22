import { CollectionsUtilsFunctions } from 'jl-utlts';
import JLeague, { IJLeagueConfig } from './Basics/JLeague';
import JTeam from './Basics/JTeam';
import JBombo from './Basics/JBombo';
import { TypeHalfWeekOfYear } from './Calendar/DateTime/types';
import { IJStageGroupInfo } from './JStage';

const CUF = CollectionsUtilsFunctions.getInstance();

let teamsList: string[] = [];
for (let i = 1; i <= 700; i++) {
  teamsList.push(`T${1000+i}`);
}
// configuracion de la fed o conf o fih
// fuente global de datos externa
export const dataCreateLB = (): IJLeagueConfig => {
  const cant: number = 10;
  const IV: boolean = true;
  let wks: TypeHalfWeekOfYear[] = [];
  let wksass: TypeHalfWeekOfYear[] = [];
  for (let i = 0; i < JLeague.getCantFchs(cant, IV); i++) {
    const wksItem = (4 * i + 12) as TypeHalfWeekOfYear;
    const wksassItem = i < 4 ? 10 : ((4 * i) as TypeHalfWeekOfYear);
    if (wksItem <= wksassItem)
      throw new Error(`se debe asignar la fech antes de jugarse`);
    wks.push(wksItem);
    wksass.push(wksassItem);
  }
  return {
    partsNumber: cant,
    isIV: IV,
    fechHalfWeeks: wks,
    fechHalfWeeksSchedule: wksass,
    temp: 1,
  };
};

export const teamSelection = (cant: number): JTeam[] => {
  let selection: string[];
  // selection = CUF.shuffled(teamsList, 0).slice(0, cant);
	selection = teamsList.slice(0, cant);
  selection.sort();
  let teams: JTeam[] = [];
	selection.forEach((val: string) => {
		teams.push(new JTeam(val));
	})
  return teams;
};

export const firstStageGroup = (): IJStageGroupInfo => {

	let out: IJStageGroupInfo = {
		groupsNumber: 4,
		isIV: true,
		participantsPerGroup: [4, 4, 4, 4],
		fechHalfWeeks: [],
		fechHalfWeeksSchedule: [],
		drawRulesValidate: (groups: Array<JTeam>) => true,
		bombos: [4, 4, 4, 4],
		temp: 1
	}

	//
	let wks: TypeHalfWeekOfYear[] = [];
  let wksass: TypeHalfWeekOfYear[] = [];
  for (let i = 0; i < JLeague.getCantFchs(out.participantsPerGroup[0], out.isIV); i++) {
    const wksItem = (4 * i + 12) as TypeHalfWeekOfYear;
    const wksassItem = i < 4 ? 10 : ((4 * i) as TypeHalfWeekOfYear);
    if (wksItem <= wksassItem)
      throw new Error(`se debe asignar la fech antes de jugarse`);
    out.fechHalfWeeks.push(wksItem);
    out.fechHalfWeeksSchedule.push(wksassItem);
  }

	// validaciones
	console.log(out.participantsPerGroup.length === out.groupsNumber)
	console.log(out.fechHalfWeeks.length === out.fechHalfWeeksSchedule.length)
	console.log(arrSum(out.participantsPerGroup) === arrSum(out.bombos))

	return out;
}

const arrSum = (en: number[]): number => {
	let out = 0;
	en.forEach( (e: number) => {out += e});
	return out;
}

export const firstStageGroupTeamSelection = (config: IJStageGroupInfo): JBombo<JTeam>[] => {
	let bombos: number[] = config.bombos;
	let groupsnumber = config.groupsNumber;
	let selection: string[];
	selection = teamsList.slice(0, bombos.reduce((a:number,b:number) => a+b));
  selection.sort();
  let teams: JTeam[] = [];
	selection.forEach((val: string) => {
		teams.push(new JTeam(val));
	})

	let i = 0;
	let out: JBombo<JTeam>[] = [];
	bombos.forEach((b: number) => {
		let j = i + b;
		out.push(
			new JBombo<JTeam>(teams.slice(i, j), Math.round(b/groupsnumber))
		)
		i = j;
	})

	
	return out;
}
