import Team from "../Team";

// // eliminar esta
// export interface IGenericRank {
//   rankId: string;
//   list: IGenericRankItem[];
// }

function toString(item: IGenericRankItem) {return `${item.origin}_${String(item.pos).padStart(4, '0')}`}

export function areEqualsGenericItems(a: IGenericRankItem, b: IGenericRankItem): boolean {
  return toString(a) == toString(b);
}

//
export interface IGenericRankItem {
  origin: string;
  pos: number;
}

export interface IRankItem {
  origin: string;
  pos: number;
  team: Team;
}