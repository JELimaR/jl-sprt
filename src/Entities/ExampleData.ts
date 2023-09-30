import { CollectionsUtilsFunctions } from 'jl-utlts';
import { IFederationData } from '../JSportModule';
import { IGenericRank } from '../JSportModule/interfaces';
import Team from '../Tournament/Team';
import { arr2 } from '../Tournament/types';
import JFederation from './Federation/JFederation';

const CUF = CollectionsUtilsFunctions.getInstance();


export const getExampleTeams = (n: number, pid: string = ''): Team[] => {
	let out: Team[] = [];
	for (let i = 1; i <= n; i++) {
		out.push(
			new Team(
				`${pid}-T${1000+i}`
			)
		)
	}
	return out;
}

export const getExampleFederations = (): JFederation[] => {
	let out: JFederation[] = [];
	for (let i=1; i < 50; i++) {
		out.push(new JFederation({
			id: `F${100+i}`,
			areaAsosiated: 'country',
			dateTimeCreation: {day: 5, interv: 0},
			headquarters: 'city',
			founders: [],
		}))
	}
	return out;
}

export function generateFederationGenericRanks(): IGenericRank[] {
  let out: IGenericRank[] = [];
  for (let fede = 1; fede <= 14; fede++) {
    const fid = `F${String(fede).padStart(3, '0')}`;
    const fteams = getExampleTeams(74, fid);
    let franking: IGenericRank = { rankId: 'fr_' + fid, list: [] };
    fteams.forEach((t, i) => franking.list.push({ origin: fid, pos: i + 1 }))
    out.push(franking);
  }
  return out;
}

export function generateFederations(n: number): IFederationData[] {
  let out: IFederationData[] = [];
  for (let fede = 1; fede <= n; fede++) {
    const fid = `F${String(fede).padStart(3, '0')}`;
    const fteams = getExampleTeams(74, fid);

    out.push({
      id: fid,
      areaAsosiatedId: `c${String(fede).padStart(3, '0')}`,
      dateTimeCreation: {day: 18598, interv: 0},
      divisionSystem: [16],
      founderIds: fteams.slice(0,5).map(t => t.id),
      headquarters: `ct${String(fede).padStart(3, '0')}`,
      institutionIds: fteams.map(t => t.id),
    });
  }
  return out;
}
