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