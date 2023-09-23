
export interface IGenericRankItem {
  origin: string;
  rank: number;
}

export interface IGenericRank {
  rankId: string;
  list: IGenericRankItem;
}

export interface IGenericSourceItem {
  source: string;
  rank: number;
}

function toString(item: IGenericRankItem) {
  return `${item.origin}_${String(item.rank).padStart(4)}`
}

//
function areEqualsGRankItem(a: IGenericRankItem, b: IGenericRankItem): boolean {
  return toString(a) == toString(b);
}