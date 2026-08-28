import Team from "../data/Team";

export type TypeTableMatchState = 'partial' | 'finished';

//
export interface IGenericRankItem {
  origin: string;
  pos: number;
}

export interface IRankItem {
  origin: string;
  pos: number;
  team: Team;
  score?: number;
}

/**
 * Tipo de entidad que genera el ranking.
 */
export type TypeRankingGenerator =
  | 'stage'
  | 'phase'
  | 'tournament'
  | 'federation'
  | 'confederation'
  | 'international';

/**
 * Tipo de entidad rankeada.
 */
export type TypeRankedEntity = 'institution' | 'federation';

/**
 * Metadatos opcionales del ranking.
 */
export interface IRankingMetadata {
  season?: number;
  generatedBy?: TypeRankingGenerator;
  rankedEntity?: TypeRankedEntity;
  sourceId?: string;
  timestamp?: number;
}

//
function toString(item: IGenericRankItem) {return `${item.origin}_${String(item.pos).padStart(4, '0')}`}

export function areEqualsGenericItems(a: IGenericRankItem, b: IGenericRankItem): boolean {
  return toString(a) == toString(b);
}

export function getIndexOfItem(genericList: IGenericRankItem[], item: IGenericRankItem): number {
  if (genericList.filter((e: IGenericRankItem) => areEqualsGenericItems(e, item)).length > 1) {
    throw new Error(`hay un elemento repetido`);
  }
  let out = -1;
  genericList.forEach((e: IGenericRankItem, i: number) => { if (areEqualsGenericItems(e, item)) out = i })
  return out;
}