import { CollectionsUtilsFunctions } from 'jl-utlts';
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

