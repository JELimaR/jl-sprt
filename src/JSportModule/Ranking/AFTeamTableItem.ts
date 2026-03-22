
import Team from "../data/Team";
import { A_TeamTableItem, IA_TeamTableItem } from "./A_TeamTableItem";

// American Football: no hay empate (overtime lo resuelve)
export type AFMatchResults = 'W' | 'L';
export type AFMatchPuntuations = 'pf' | 'pa'; // points for, points against

export type IAFTeamTableItem = IA_TeamTableItem<AFMatchResults, AFMatchPuntuations> & {
  pd: number; // point differential
};

export default class AFTeamTableItem extends A_TeamTableItem<AFMatchResults, AFMatchPuntuations> {

  constructor(t: Team, bsId: string) {
    super(t, bsId);
  }

  get ps(): number {
    // 2 puntos por victoria
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

  getSortFunc(): (a: A_TeamTableItem<AFMatchResults, AFMatchPuntuations>, b: A_TeamTableItem<AFMatchResults, AFMatchPuntuations>, isSE: boolean) => number {
    return afSimpleSortFunc;
  }

  getInterface(): IAFTeamTableItem {
    return {
      ...(super.getInterface() as IA_TeamTableItem<AFMatchResults, AFMatchPuntuations>),
      pd: this.pd,
    };
  }
}

export const afSimpleSortFunc = (a: A_TeamTableItem<AFMatchResults, AFMatchPuntuations>, b: A_TeamTableItem<AFMatchResults, AFMatchPuntuations>, isSE: boolean): number => {
  if (isSE) {
    if (a.P - b.P !== 0) return b.P - a.P;
  }
  if (b.pos - a.pos !== 0) return a.pos - b.pos;
  if (!isSE) {
    if (a.pm - b.pm !== 0) return b.pm - a.pm;
  }
  if (a.ps - b.ps !== 0) return b.ps - a.ps;
  // point differential
  if ((a as AFTeamTableItem).pd - (b as AFTeamTableItem).pd !== 0) {
    return (b as AFTeamTableItem).pd - (a as AFTeamTableItem).pd;
  }
  // points for
  return (b as AFTeamTableItem).pf - (a as AFTeamTableItem).pf;
};
