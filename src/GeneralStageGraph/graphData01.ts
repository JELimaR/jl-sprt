import { IGenericRank, IGenericRankItem } from "../JSportModule/interfaces";


export function getExampleGenericRankItems(): IGenericRankItem[] {
  return [
    {origin: 'fr_f01', pos: 1},
    {origin: 'fr_f02', pos: 1},
    {origin: 'fr_f03', pos: 1},
    {origin: 'fr_f04', pos: 1},
    {origin: 'fr_f05', pos: 1},
    {origin: 'fr_f06', pos: 1},
    {origin: 'fr_f07', pos: 1},
    {origin: 'fr_f08', pos: 1},
    {origin: 'fr_f09', pos: 1},
    {origin: 'fr_f10', pos: 1},
    {origin: 'fr_f01', pos: 2},
    {origin: 'fr_f02', pos: 2},
    {origin: 'fr_f03', pos: 2},
    {origin: 'fr_f04', pos: 2},
    {origin: 'fr_f05', pos: 2},
    {origin: 'fr_f06', pos: 2},
    {origin: 'fr_f07', pos: 2},
    {origin: 'fr_f01', pos: 3},
    {origin: 'fr_f02', pos: 3},
    {origin: 'fr_f03', pos: 3},
    {origin: 'fr_f04', pos: 3},
    {origin: 'fr_f05', pos: 3},
    {origin: 'fr_f06', pos: 3},
    {origin: 'fr_f01', pos: 4},
    {origin: 'fr_f02', pos: 4},
    {origin: 'fr_f03', pos: 4},
    {origin: 'fr_f04', pos: 4},
    {origin: 'fr_f05', pos: 4},
    {origin: 'fr_f11', pos: 1},
    {origin: 'fr_f12', pos: 1},
    {origin: 'fr_f01', pos: 5},
    {origin: 'fr_f02', pos: 5},
    {origin: 'fr_f03', pos: 5},
    {origin: 'fr_f04', pos: 5},
    {origin: 'fr_f07', pos: 3},
    {origin: 'fr_f08', pos: 2},
    {origin: 'fr_f09', pos: 2},
    {origin: 'fr_f10', pos: 2},
    {origin: 'fr_f11', pos: 2},
    {origin: 'fr_f12', pos: 2},
    {origin: 'fr_f13', pos: 1},
    {origin: 'fr_f14', pos: 1},
  ];
}

export function getInitialRanksGroupsExample() {
  const out: IGenericRank[] = [];
  const iniItems = getExampleGenericRankItems();
  let end = 0;
  [28, 2, 12].forEach((groupNumber: number, i: number, arr: number[]) => {
    end += groupNumber;
    const start = end - groupNumber
    const list = iniItems.slice(start, end);
    out.push({rankId: 'ini', list});
  })
  return out;
}


