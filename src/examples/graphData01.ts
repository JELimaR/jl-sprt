import { getExampleTeams } from "../Entities/ExampleData";
import { Ranking, TypeRanking } from "../JSportModule";
import { IGenericRank, IGenericRankItem } from "../JSportModule/interfaces";

export function getFederationRankings(count: number): Map<string, Ranking> {
  let out: Map<string, Ranking> = new Map<string, Ranking>();
  for (let fede = 1; fede <= count; fede++) {
    const fid = `F${String(fede).padStart(3, '0')}`;
    const fteams = getExampleTeams(45, fid);
    let ftr: TypeRanking = { context: 'fr_' + fid, items: [], teams: [] };
    fteams.forEach((t, i) => ftr.items.push({ origin: fid, pos: i + 1 }))
    const franking = Ranking.fromTypeRanking(ftr);
    franking.addTeams(fteams);

    out.set(franking.context, franking);
  }

  return out;
}

export function getExampleRankItemsListOrdered(): IGenericRankItem[] {
  return [
    {origin: 'fr_F001', pos: 1},
    {origin: 'fr_F002', pos: 1},
    {origin: 'fr_F003', pos: 1},
    {origin: 'fr_F004', pos: 1},
    {origin: 'fr_F005', pos: 1},
    {origin: 'fr_F006', pos: 1},
    {origin: 'fr_F007', pos: 1},
    {origin: 'fr_F008', pos: 1},
    {origin: 'fr_F009', pos: 1},
    {origin: 'fr_F010', pos: 1},
    {origin: 'fr_F001', pos: 2},
    {origin: 'fr_F002', pos: 2},
    {origin: 'fr_F003', pos: 2},
    {origin: 'fr_F004', pos: 2},
    {origin: 'fr_F005', pos: 2},
    {origin: 'fr_F006', pos: 2},
    {origin: 'fr_F007', pos: 2},
    {origin: 'fr_F001', pos: 3},
    {origin: 'fr_F002', pos: 3},
    {origin: 'fr_F003', pos: 3},
    {origin: 'fr_F004', pos: 3},
    {origin: 'fr_F005', pos: 3},
    {origin: 'fr_F006', pos: 3},
    {origin: 'fr_F001', pos: 4},
    {origin: 'fr_F002', pos: 4},
    {origin: 'fr_F003', pos: 4},
    {origin: 'fr_F004', pos: 4},
    {origin: 'fr_F005', pos: 4},
    {origin: 'fr_F011', pos: 1},
    {origin: 'fr_F012', pos: 1},
    {origin: 'fr_F001', pos: 5},
    {origin: 'fr_F002', pos: 5},
    {origin: 'fr_F003', pos: 5},
    {origin: 'fr_F004', pos: 5},
    {origin: 'fr_F007', pos: 3},
    {origin: 'fr_F008', pos: 2},
    {origin: 'fr_F009', pos: 2},
    {origin: 'fr_F010', pos: 2},
    {origin: 'fr_F011', pos: 2},
    {origin: 'fr_F012', pos: 2},
    {origin: 'fr_F013', pos: 1},
    {origin: 'fr_F014', pos: 1},
  ];
}

// export function getInitialRankingExampe() {
//   const out: Ranking[] = [];
//   const iniItems = getExampleGenericRankItems();
//   let end = 0;
//   [28, 2, 12].forEach((groupNumber: number) => {
//     end += groupNumber;
//     const start = end - groupNumber
//     const list = iniItems.slice(start, end);
//     out.push({rankId: 'ini', list});
//   })
//   return out;
// }

export function getInitialRankingExample() {
  const ini_tr: TypeRanking = {
    context: 'ini',
    items: getExampleRankItemsListOrdered(),
    teams: [],
  };
  console.log(ini_tr.items)

  return Ranking.fromTypeRanking(ini_tr);
}
