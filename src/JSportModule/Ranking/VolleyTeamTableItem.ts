
import Team from "../data/Team";
import { A_TeamTableItem, IA_TeamTableItem } from "./A_TeamTableItem";

// Volleyball: no hay empate, se juega a 3 de 5 sets
export type VolleyMatchResults = 'W3_0' | 'W3_1' | 'W3_2' | 'L2_3' | 'L1_3' | 'L0_3';
export type VolleyMatchPuntuations = 'sw' | 'sl' | 'pf' | 'pa'; // sets won, sets lost, points for, points against

export type IVolleyTeamTableItem = IA_TeamTableItem<VolleyMatchResults, VolleyMatchPuntuations> & {
  sd: number; // set differential
  W: number;  // total wins
  L: number;  // total losses
};

export default class VolleyTeamTableItem extends A_TeamTableItem<VolleyMatchResults, VolleyMatchPuntuations> {

  constructor(t: Team, bsId: string) {
    super(t, bsId);
  }

  /**
   * Puntos: 3 por victoria 3-0 o 3-1, 2 por victoria 3-2, 1 por derrota 2-3, 0 por el resto
   */
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

  getSortFunc(): (a: A_TeamTableItem<VolleyMatchResults, VolleyMatchPuntuations>, b: A_TeamTableItem<VolleyMatchResults, VolleyMatchPuntuations>, isSE: boolean) => number {
    return volleySimpleSortFunc;
  }

  getInterface(): IVolleyTeamTableItem {
    return {
      ...(super.getInterface() as IA_TeamTableItem<VolleyMatchResults, VolleyMatchPuntuations>),
      sd: this.sd,
      W: this.W,
      L: this.L,
    };
  }
}

export const volleySimpleSortFunc = (a: A_TeamTableItem<VolleyMatchResults, VolleyMatchPuntuations>, b: A_TeamTableItem<VolleyMatchResults, VolleyMatchPuntuations>, isSE: boolean): number => {
  if (isSE) {
    if (a.P - b.P !== 0) return b.P - a.P;
  }
  if (b.pos - a.pos !== 0) return a.pos - b.pos;
  if (!isSE) {
    if (a.pm - b.pm !== 0) return b.pm - a.pm;
  }
  // puntos
  if (a.ps - b.ps !== 0) return b.ps - a.ps;
  // set differential
  if ((a as VolleyTeamTableItem).sd - (b as VolleyTeamTableItem).sd !== 0) {
    return (b as VolleyTeamTableItem).sd - (a as VolleyTeamTableItem).sd;
  }
  // sets won
  if ((a as VolleyTeamTableItem).sw - (b as VolleyTeamTableItem).sw !== 0) {
    return (b as VolleyTeamTableItem).sw - (a as VolleyTeamTableItem).sw;
  }
  // point differential
  return (b as VolleyTeamTableItem).pf - (a as VolleyTeamTableItem).pa
    - ((a as VolleyTeamTableItem).pf - (a as VolleyTeamTableItem).pa);
};
