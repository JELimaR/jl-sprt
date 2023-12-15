import Team from "../Team";

export interface ITeamTableItem {
  pos: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  ge: number;
  sg: number;
  ps: number;
  pm: number;
  team: string;
}

export default class TeamTableItem {
  private _team: Team;
  private _pos: number = 1;
  private _pg: number = 0;
  private _pe: number = 0;
  private _pp: number = 0;

  private _gf: number = 0;
  private _ge: number = 0;

  private _bsId: string;

  constructor(t: Team, bsId: string) {
    this._team = t;
    this._bsId = bsId;
  }

  get bsId(): string { return this._bsId }

  set pos(pos: number) { this._pos = pos };
  get pos(): number { return this._pos };

  get pj(): number {
    return this._pg + this._pe + this._pp;
  }
  get pg(): number {
    return this._pg;
  }
  get pe(): number {
    return this._pe;
  }
  get pp(): number {
    return this._pp;
  }
  get gf(): number {
    return this._gf;
  }
  get ge(): number {
    return this._ge;
  }
  get sg(): number {
    return this._gf - this._ge;
  }
  get pm(): number {
    return this.pj == 0 ? 0 : Math.round(this.ps/this.pj*1000)/1000
  }
  get ps(): number {
    return 3 * this._pg + this._pe;
  }
  addPg() { this._pg++ }
  addPe() { this._pe++ }
  addPp() { this._pp++ }

  addGf(g: number) { this._gf += g }
  addGe(g: number) { this._ge += g }

  get team(): Team {
    return this._team;
  }

  getInterface(): ITeamTableItem {
    return {
      pos: this.pos,
      pj: this.pj,
      pg: this.pg,
      pe: this.pe,
      pp: this.pp,
      gf: this.gf,
      ge: this.ge,
      sg: this.sg,
      ps: this.ps,
      pm: this.pm,
      team: this.team.id,
    };
  }
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