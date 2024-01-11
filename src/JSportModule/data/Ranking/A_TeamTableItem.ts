import Team from "../Team";

export type TBasicPosibleMatchTeamResult = 'W' | 'L';
export type TBasicMatchPuntuation = 'gf' | 'ge';

export type IA_TeamTableItem<Res extends string, Punt extends string> = {
  [k in Res]: number;
} & {
  [k in Punt]: number;
} & {
  pos: number;
  P: number;

  // W: number;
  // D: number;
  // L: number;

  // gf: number;
  // ga: number;
  // sg: number;
  ps: number;
  pm: number;
  team: string;
};

export default abstract class A_TeamTableItem {
  private _team: Team;
  private _pos: number = 1;
  private _W: number = 0;
  // private _D: number = 0;
  private _L: number = 0;

  // private _gf: number = 0;
  // private _ga: number = 0;

  private _bsId: string;

  constructor(t: Team, bsId: string) {
    this._team = t;
    this._bsId = bsId;
  }

  get bsId(): string { return this._bsId }

  set pos(pos: number) { this._pos = pos };
  get pos(): number { return this._pos };

  abstract get P(): number;
  get W(): number {
    return this._W;
  }
  // get D(): number {
  //   return this._D;
  // }
  get L(): number {
    return this._L;
  }
  // get gf(): number {
  //   return this._gf;
  // }
  // get ge(): number {
  //   return this._ga;
  // }
  // get sg(): number {
  //   return this._gf - this._ga;
  // }
  get pm(): number {
    return this.P == 0 ? 0 : Math.round(this.ps/this.P*1000)/1000
  }
  
  abstract get ps(): number;

  addWM() { this._W++ }
  addLM() { this._L++ }

  // addGf(g: number) { this._gf += g }
  // addGe(g: number) { this._ga += g }

  get team(): Team {
    return this._team;
  }

  getInterface(): IA_TeamTableItem<'W' | 'L', 'u'> {
    return {
      pos: this.pos,
      P: this.P,
      W: this.W,
      // D: this.D,
      L: this.L,
      u: 8,
      // gf: this.gf,
      // ga: this.ge,
      // sg: this.sg,
      ps: this.ps,
      pm: this.pm,
      team: this.team.id,
    };
  }


}

export const A_simpleSortFunc = (a: A_TeamTableItem, b: A_TeamTableItem, isSE: boolean): number => {
  if (isSE) {
    if (a.P - b.P !== 0) {
      return b.P - a.P
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
  // if (a.ps - b.ps !== 0) {
    return b.ps - a.ps;
  // }
  // if (a.sg - b.sg !== 0) {
  //   return b.sg - a.sg;
  // }
  // return b.gf - a.gf;
}