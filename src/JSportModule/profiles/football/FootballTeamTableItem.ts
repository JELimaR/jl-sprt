
import Team from "../../data/Team";
import { A_TeamTableItem, IA_TeamTableItemBase, SortFunc } from "../../Ranking/A_TeamTableItem";

export type FootballMatchResults = 'W' | 'D' | 'L';
export type FootballMatchPuntuations = 'gf' | 'ga';

export type IFootballTeamTableItem = IA_TeamTableItemBase & {
  W: number;
  D: number;
  L: number;
  gf: number;
  ga: number;
  sg: number;
};

export default class FootballTeamTableItem extends A_TeamTableItem<FootballMatchResults, FootballMatchPuntuations> {

  constructor(t: Team, bsId: string) {
    super(t, bsId);
  }

  get ps(): number {
    const { W, D } = this.matchResults;
    return 3 * W + D;
  }

  getInitialCountOfMathResults(): { [k in FootballMatchResults]: number } {
    return { W: 0, D: 0, L: 0 };
  }

  getInitialCountOfMathPuntuations(): { [k in FootballMatchPuntuations]: number } {
    return { gf: 0, ga: 0 };
  }

  get W(): number { return this.matchResults.W }
  get D(): number { return this.matchResults.D }
  get L(): number { return this.matchResults.L }

  get gf(): number { return this.matchPuntuations.gf }
  get ga(): number { return this.matchPuntuations.ga }
  get sg(): number { return this.gf - this.ga }

  // Alias de compatibilidad
  get ge(): number { return this.ga }

  addWM() { this.addMatchResult('W') }
  addDM() { this.addMatchResult('D') }
  addLM() { this.addMatchResult('L') }

  addGf(g: number) { this.matchPuntuations.gf += g }
  addGa(g: number) { this.matchPuntuations.ga += g }
  addGe(g: number) { this.addGa(g) }

  getSortFunc(): SortFunc {
    return footballSortFunc;
  }

  getInterface(): IFootballTeamTableItem {
    return {
      ...super.getInterface(),
      W: this.W,
      D: this.D,
      L: this.L,
      gf: this.gf,
      ga: this.ga,
      sg: this.sg,
    };
  }
}

export const footballSortFunc: SortFunc = (a, b, isSE): number => {
  if (isSE) {
    if (a.P - b.P !== 0) return b.P - a.P;
  }
  if (b.pos - a.pos !== 0) return a.pos - b.pos;
  if (!isSE) {
    if (a.pm - b.pm !== 0) return b.pm - a.pm;
  }
  if (a.ps - b.ps !== 0) return b.ps - a.ps;
  if ((a as any).sg - (b as any).sg !== 0) {
    return (b as any).sg - (a as any).sg;
  }
  return (b as any).gf - (a as any).gf;
};
