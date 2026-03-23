
import Team from "../../data/Team";
import { A_TeamTableItem, IA_TeamTableItemBase, SortFunc } from "../../Ranking/A_TeamTableItem";

// American Football: no hay empate (overtime lo resuelve)
export type AFMatchResults = 'W' | 'L';
export type AFMatchPuntuations = 'pf' | 'pa'; // points for, points against

export type IAFTeamTableItem = IA_TeamTableItemBase & {
  W: number;
  L: number;
  pf: number;
  pa: number;
  pd: number;
};

export default class AFTeamTableItem extends A_TeamTableItem<AFMatchResults, AFMatchPuntuations> {

  constructor(t: Team, bsId: string) {
    super(t, bsId);
  }

  get ps(): number {
    return 2 * this.matchResults.W;
  }

  getInitialCountOfMathResults(): { [k in AFMatchResults]: number } {
    return { W: 0, L: 0 };
  }

  getInitialCountOfMathPuntuations(): { [k in AFMatchPuntuations]: number } {
    return { pf: 0, pa: 0 };
  }

  get W(): number { return this.matchResults.W }
  get L(): number { return this.matchResults.L }

  get pf(): number { return this.matchPuntuations.pf }
  get pa(): number { return this.matchPuntuations.pa }
  get pd(): number { return this.pf - this.pa }

  addWM() { this.addMatchResult('W') }
  addLM() { this.addMatchResult('L') }

  addPf(p: number) { this.matchPuntuations.pf += p }
  addPa(p: number) { this.matchPuntuations.pa += p }

  getSortFunc(): SortFunc {
    return afSimpleSortFunc;
  }

  getInterface(): IAFTeamTableItem {
    return {
      ...super.getInterface(),
      W: this.W, L: this.L,
      pf: this.pf, pa: this.pa, pd: this.pd,
    };
  }
}

export const afSimpleSortFunc: SortFunc = (a, b, isSE): number => {
  if (isSE) {
    if (a.P - b.P !== 0) return b.P - a.P;
  }
  if (b.pos - a.pos !== 0) return a.pos - b.pos;
  if (!isSE) {
    if (a.pm - b.pm !== 0) return b.pm - a.pm;
  }
  if (a.ps - b.ps !== 0) return b.ps - a.ps;
  if ((a as any).pd - (b as any).pd !== 0) return (b as any).pd - (a as any).pd;
  return (b as any).pf - (a as any).pf;
};
