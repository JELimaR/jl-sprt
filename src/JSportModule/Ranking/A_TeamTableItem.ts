import Team from "../data/Team";

export type IA_TeamTableItem<Res extends string, Punt extends string> = {
  [k in Res]: number;
} & {
  [k in Punt]: number;
} & {
  pos: number;
  P: number;

  ps: number;
  pm: number;
  team: string;
};

export abstract class A_TeamTableItem<Res extends string, Punt extends string> {
  private _team: Team;
  private _pos: number = 1;

  private _matchResults: { [k in Res]: number };
  private _matchPuntuations: { [k in Punt]: number };

  private _bsId: string;

  constructor(t: Team, bsId: string) {
    this._team = t;
    this._bsId = bsId;

    this._matchResults = this.getInitialCountOfMathResults();
    this._matchPuntuations = this.getInitialCountOfMathPuntuations();
  }

  /**
   * Generar los valores iniciales de MatchTeamResults
   */
  abstract getInitialCountOfMathResults(): { [k in Res]: number; };
  /**
   * generar los valores iniciales de MatchTeamPuntuation
   */
  abstract getInitialCountOfMathPuntuations(): { [k in Punt]: number; };

  get bsId(): string { return this._bsId }

  set pos(pos: number) { this._pos = pos };
  get pos(): number { return this._pos };

  get P(): number {
    let out = 0;
    for (let k in this._matchResults) {
      out += this._matchResults[k];
    }
    return out;
  }

  get pm(): number {
    return this.P == 0 ? 0 : Math.round(this.ps / this.P * 1000) / 1000
  }

  get matchResults() { return this._matchResults }
  get matchPuntuations() { return this._matchPuntuations }

  /**
   * calculo de puntos
   */
  abstract get ps(): number;

  addMatchResult(r: Res) { this._matchResults[r]++ }

  addMatchPuntuation(p: Punt) { this._matchPuntuations[p]++ }

  get team(): Team {
    return this._team;
  }

  abstract getSortFunc(): (a: A_TeamTableItem<Res, Punt>, b: A_TeamTableItem<Res, Punt>, isSE: boolean) => number;

  getInterface(): IA_TeamTableItem<Res, Punt> {
    return {
      pos: this.pos,
      P: this.P,
      ...this._matchResults,
      ...this._matchPuntuations,
      ps: this.ps,
      pm: this.pm,
      team: this.team.id,
    };
  }

}

const A_simpleSortFunc = (a: A_TeamTableItem<any, any>, b: A_TeamTableItem<any, any>, isSE: boolean): number => {
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