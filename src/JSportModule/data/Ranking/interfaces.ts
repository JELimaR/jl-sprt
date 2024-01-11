import Team from "../Team";

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
}