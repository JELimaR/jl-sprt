import { JDate } from "../JCalendar";
import { Country, IFederationCreator, IFederationData, IInstitutionCreator, Institution, Town } from "../JSportModule";
import Team from "../JSportModule/data/Team";
import { IGenericRank } from "../JSportModule/interfaces";


export const getExampleTeams = (n: number, pid: string = ''): Team[] => {
	let out: Team[] = [];
	for (let i = 1; i <= n; i++) {
    const iid = `${pid}-T${1000+i}`;
    const cid = `C${String(14).padStart(3, '0')}`;
    const tid = `T${String(Math.round(321 * Math.random() + 187 * Math.random())).padStart(8, '0')}`;
		out.push(
			new Team({
        category: 'S',
        entity: new Institution({
          id: iid, name: iid, shortName: iid, abrevName: iid,
          headquarters: new Town({i: tid, n: tid, c: cid, p: 2, a: 5}),
          funtationDay: new JDate(13556)
        }),
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
      id: fid, areaAsosiated: new Country({ i: cid, n: 'Country_' + cid, r: '1', a: 18141, p: 1576000 }),
      name: `Medval ${fid}`, shortName: fid,
      fundationDay: new JDate(Math.round(378 * (1888 + 24 * Math.random()) + 378 * Math.random())),
      members: new Map<string, Institution>(),
      founderMembers: [], headquarters: new Town({ i: tid, n: 'Town_' + tid, c: '12', a: 18, p: 15400 }),
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
      id: iid, name: iid, shortName: iid, abrevName: iid,
      headquarters: new Town({i: tid, n: tid, c: cid, p: 2, a: 5}),
      funtationDay: new JDate(13556)
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

