
export interface IGenericRankItem {
  // t: 'r',
  origin: string;
  pos: number;
}

export interface IGenericRank {
  rankId: string;
  list: IGenericRankItem[];
}

// export interface IGenericSourceItem {
//   t: 's',
//   source: string;
//   pos: number;
// }

// export interface IGenericSource {
//   sourceId: string;
//   list: IGenericSourceItem[];
// }

// function toString(item: IGenericRankItem | IGenericSourceItem) {
//   let s: string;
//   if (item.t == 'r') s = item.origin;
//   else s = item.source;
//   return `${s}_${String(item.pos).padStart(4)}`
// }
function toString(item: IGenericRankItem) {return `${item.origin}_${String(item.pos).padStart(4, '0')}`}

function areEqualsGenericItems(a: IGenericRankItem, b: IGenericRankItem): boolean {
  return toString(a) == toString(b);
}

function getIndexOf(generic: IGenericRank, item: IGenericRankItem): number {
  if (generic.list.filter((e: IGenericRankItem) => areEqualsGenericItems(e, item)).length > 1) {
    throw new Error(`hay un elemento repetido`);
  }
  let out = -1;
  generic.list.forEach((e: IGenericRankItem, i: number) => { if (areEqualsGenericItems(e, item)) out = i })
  return out;

}