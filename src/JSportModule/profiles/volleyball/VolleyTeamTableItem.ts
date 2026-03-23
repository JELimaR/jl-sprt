
import Team from "../../data/Team";
import { A_TeamTableItem, IA_TeamTableItemBase, SortFunc } from "../../Ranking/A_TeamTableItem";

export type VolleyMatchResults = 'W3_0' | 'W3_1' | 'W3_2' | 'L2_3' | 'L1_3' | 'L0_3';
export type VolleyMatchPuntuations = 'sw' | 'sl' | 'pf' | 'pa';

export type IVolleyTeamTableItem = IA_TeamTableItemBase & {
  W3_0: number; W3_1: number; W3_2: number;
  L2_3: number; L1_3: number; L0_3: number;
  sw: number; sl: number; pf: number; pa: number;
  sd: number; W: number; L: number;
};

export default class VolleyTeamTableItem extends A_TeamTableItem<VolleyMatchResults, VolleyMatchPuntuations> {

  constructor(t: Team, bsId: string) {
    super(t, bsId);
  }

  get ps(): number {
    const r = this.matchResults;
    return 3 * r.W3_0 + 3 * r.W3_1 + 2 * r.W3_2 + 1 * r.L2_3;
  }

  getInitialCountOfMathResults(): { [k in VolleyMatchResults]: number } {
    return { W3_0: 0, W3_1: 0, W3_2: 0, L2_3: 0, L1_3: 0, L0_3: 0 };
  }

  getInitialCountOfMathPuntuations(): { [k in VolleyMatchPuntuations]: number } {
    return { sw: 0, sl: 0, pf: 0, pa: 0 };
  }

  get W(): number { return this.matchResults.W3_0 + this.matchResults.W3_1 + this.matchResults.W3_2 }
  get L(): number { return this.matchResults.L2_3 + this.matchResults.L1_3 + this.matchResults.L0_3 }

  get sw(): number { return this.matchPuntuations.sw }
  get sl(): number { return this.matchPuntuations.sl }
  get pf(): number { return this.matchPuntuations.pf }
  get pa(): number { return this.matchPuntuations.pa }
  get sd(): number { return this.sw - this.sl }

  addSw(s: number) { this.matchPuntuations.sw += s }
  addSl(s: number) { this.matchPuntuations.sl += s }
  addPf(p: number) { this.matchPuntuations.pf += p }
  addPa(p: number) { this.matchPuntuations.pa += p }

  getSortFunc(): SortFunc {
    return volleySimpleSortFunc;
  }

  getInterface(): IVolleyTeamTableItem {
    return {
      ...super.getInterface(),
      W3_0: this.matchResults.W3_0, W3_1: this.matchResults.W3_1, W3_2: this.matchResults.W3_2,
      L2_3: this.matchResults.L2_3, L1_3: this.matchResults.L1_3, L0_3: this.matchResults.L0_3,
      sw: this.sw, sl: this.sl, pf: this.pf, pa: this.pa,
      sd: this.sd, W: this.W, L: this.L,
    };
  }
}

export const volleySimpleSortFunc: SortFunc = (a, b, isSE): number => {
  if (isSE) {
    if (a.P - b.P !== 0) return b.P - a.P;
  }
  if (b.pos - a.pos !== 0) return a.pos - b.pos;
  if (!isSE) {
    if (a.pm - b.pm !== 0) return b.pm - a.pm;
  }
  if (a.ps - b.ps !== 0) return b.ps - a.ps;
  if ((a as any).sd - (b as any).sd !== 0) return (b as any).sd - (a as any).sd;
  if ((a as any).sw - (b as any).sw !== 0) return (b as any).sw - (a as any).sw;
  return (b as any).pf - (b as any).pa - ((a as any).pf - (a as any).pa);
};
