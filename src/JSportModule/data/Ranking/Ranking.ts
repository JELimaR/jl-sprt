import { TQualyCondition } from "../elementsConfig";
import Team from "../Team";
import { IGenericRankItem, IRankItem } from "./interfaces";

// export interface IGenericRankItem {
//   origin: string;
//   pos: number;
// }

// export interface IRankItem {
//   origin: string;
//   pos: number;
//   team: Team;
// }

export type TypeRanking = {
  context: string;
  items: IGenericRankItem[];
  teams: Team[];
}

export class Ranking {
  private _context: string;
  private _items: IGenericRankItem[];
  private _teams: Team[];

  private _final: boolean = false; // ver como se debe hacer

  private constructor(tr: TypeRanking) {
    this._context = tr.context;
    this._items = tr.items;
    this._teams = tr.teams;
  }

  get isBlocked(): boolean {
    return this._teams.length == this._items.length;
  }

  get context(): string { return this._context }

  get size(): number { return this._items.length }

  getGenericRankItems(): IGenericRankItem[] { return [...this._items] }

  getRankTable(): IRankItem[] {
    let out: IRankItem[] = [];
    if (this.isBlocked) {
      out = this._items.map((gri: IGenericRankItem, idx: number) => {
        return { origin: gri.origin, pos: gri.pos, team: this._teams[idx] }
      })
    }
    return out;
  }

  addTeams(t: Team[]) {
    if (this._items.length == t.length) {
      this._teams = [...t];
    }
  }

  getInterface(): TypeRanking {
    return {
      context: this._context,
      items: [...this._items],
      teams: [...this._teams]
    }
  }

  getFromPosition(pos: number): IRankItem {
    const idx = this._items.findIndex(e => e.pos == pos);
    if (this.isBlocked && idx !== -1) {
      return {...this._items[idx], team: this._teams[idx]};
    } else {
      throw new Error(`
      Ranking no esta bloqueado:
        items length: ${this._items.length}
        teams length: ${this._teams.length}
      O
      Ranking no cuenta con la posicion: ${pos}
        index: ${idx}
      en ranking.getFromPosition`)
    }
  }

  //
  getQualyCondition(): TQualyCondition {
    return {
      rankId: this._context,
      season: 'current',
      minRankPos: this._items[0].pos,
      maxRankPos: this._items[this._items.length - 1].pos,
    }
  }

  copy(): Ranking {
    return new Ranking(this.getInterface());
  }

  // statics
  static fromTypeRanking(tr: TypeRanking): Ranking {
    return new Ranking(tr);
  }

  static fromQualyCondition(qc: TQualyCondition): Ranking {
    const tr: TypeRanking = { context: qc.rankId, items: [], teams: [] };
    for (let r = qc.minRankPos; r <= qc.maxRankPos; r++) {
      tr.items.push({ origin: qc.rankId, pos: r });
    }
    return new Ranking(tr);
  }

  static fromRankItemArr(context: string, arr: IRankItem[]) {
    return new Ranking({
      context: context,
      items: arr.map((ri: IRankItem) => { return { ...ri } }),
      teams: arr.map((ri: IRankItem) => ri.team ),
    })
  }

}