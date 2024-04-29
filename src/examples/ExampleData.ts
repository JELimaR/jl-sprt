import { Country, IFederationCreator, IFederationData, IInstitutionCreator, Institution, Town } from "../JSportModule";
import Team from "../JSportModule/data/Team";
import { IGenericRank } from "../JSportModule/interfaces";


export const getExampleTeams = (n: number, pid: string = ''): Team[] => {
	let out: Team[] = [];
	for (let i = 1; i <= n; i++) {
		out.push(
			new Team({
        category: 'S',
        entity: new Institution({id: `${pid}-T${1000+i}`}),
        matches: []
      })
		)
	}
	return out;
}

export const getFederationCreators = (count: number) => {
  let out: IFederationCreator[] = [];

  for (let fede = 1; fede <= count; fede++) {
    const fid = `F${String(fede).padStart(3, '0')}`;
    const cid = `C${String(fede).padStart(3, '0')}`;
    const tid = `T${String(Math.round(fede * 321 * Math.random() + 187 * Math.random())).padStart(8, '0')}`;

    out.push({
      id: fid, areaAsosiated: new Country({ id: cid }),
      fundationDay: Math.round(378 * (1888 + 24 * Math.random()) + 378 * Math.random()),
      founders: [], headquarters: new Town({ id: tid }), institutions: [],
      cupSystem: {}, leagueSystem: {}, rankings: {}
    });
  }

  return out;
}

export const getInstitutionCreators = (count: number, cid: string) => {
  let out: IInstitutionCreator[] = [];
  for (let ii = 1; ii <= count; ii++) {
    const iid = `${cid}_I${String(ii).padStart(3, '0')}`;
    const tid = `T${String(Math.round(ii * 321 * Math.random() + 187 * Math.random())).padStart(8, '0')}`;

    out.push({
      id: iid
    })

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

