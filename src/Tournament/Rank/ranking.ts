import Team from "../Team";
import TeamTableItem from "./TeamTableItem";

export type TypeTableMatchState = 'partial' | 'finished';

export interface RankItem {
  team: Team;
  rank: number;
  originId: string;
}

export type TypeRanking = {
  rankId: string;
  // state: 'partial' | 'final';
  table: RankItem[];
}

export const simpleSortFunc = (a: TeamTableItem, b: TeamTableItem, isSE: boolean) => {
  if (isSE) {
    if (a.pj - b.pj !== 0) {
      return b.pj - a.pj
    }
  }
  if (b.pos - a.pos !== 0) {
    return a.pos - b.pos
  }
  if (!isSE) {
    if (a.pm - b.pm !== 0) {
      return b.pm - a.pm
    }
  }
  if (a.ps - b.ps !== 0) {
    return b.ps - a.ps;
  }
  if (a.sg - b.sg !== 0) {
    return b.sg - a.sg;
  }
  return b.gf - a.gf;
}