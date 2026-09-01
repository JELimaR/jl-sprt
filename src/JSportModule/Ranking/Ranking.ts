import { TQualyCondition } from "../data/elementsConfig";
import Team from "../data/Team";
import { IGenericRankItem, IRankingMetadata, IRankItem } from "./interfaces";
import { RankingStore } from "./RankingStore";

export type TypeRanking = {
  context: string;
  items: IGenericRankItem[];
  teams: Team[];
  scores?: number[];
  metadata?: IRankingMetadata;
}

export class Ranking {
  private _context: string;
  private _items: IGenericRankItem[];
  private _teams: Team[];
  private _scores: (number | undefined)[];
  private _metadata: IRankingMetadata | undefined;

  private _final: boolean = false; // ver como se debe hacer

  private constructor(tr: TypeRanking) {
    if (tr.teams.length !== 0 && tr.items.length !== tr.teams.length) {
      throw new Error(`El ranking ${tr.context} no se puede crear debido a que la cantidad de ` +
        `items: ${tr.items.length} no es igual a la cantidad de teams: ${tr.teams.length}. ` +
        `en Ranking.constructor`)
    }
    this._context = tr.context;
    this._items = tr.items;
    this._teams = tr.teams;
    this._scores = tr.scores ?? tr.items.map(() => undefined);
    this._metadata = tr.metadata;
  }

  get isBlocked(): boolean {
    return this._teams.length == this._items.length;
  }

  get context(): string { return this._context }

  get size(): number { return this._items.length }

  get metadata(): IRankingMetadata | undefined { return this._metadata }

  getGenericRankItems(): IGenericRankItem[] { return this._items.map(it => { return {origin: it.origin, pos: it.pos} }) }

  getRankTable(): IRankItem[] {
    let out: IRankItem[] = [];
    if (this.isBlocked) {
      out = this._items.map((gri: IGenericRankItem, idx: number) => {
        return { origin: gri.origin, pos: gri.pos, team: this._teams[idx], score: this._scores[idx] }
      })
    }
    return out;
  }

  addTeams(t: Team[]) {
    if (this._items.length !== t.length) {
      throw new Error(`No se pueden asignar teams al ranking "${this._context}": ` +
        `cantidad de items (${this._items.length}) distinta de la cantidad de teams (${t.length}). ` +
        `en Ranking.addTeams`);
    }
    this._teams = [...t];
  }

  getInterface(): TypeRanking {
    return {
      context: this._context,
      items: [...this._items],
      teams: [...this._teams],
      scores: [...this._scores] as number[] | undefined,
      metadata: this._metadata ? { ...this._metadata } : undefined,
    }
  }

  getFromPosition(pos: number): IRankItem {
    if (!this.isBlocked) {
      throw new Error(`Ranking "${this._context}" no esta bloqueado ` +
        `(items: ${this._items.length}, teams: ${this._teams.length}). ` +
        `en Ranking.getFromPosition`);
    }
    const idx = this._items.findIndex(e => e.pos == pos);
    if (idx === -1) {
      throw new Error(`Ranking "${this._context}" no cuenta con la posicion: ${pos}. ` +
        `en Ranking.getFromPosition`);
    }
    return { ...this._items[idx], team: this._teams[idx], score: this._scores[idx] };
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

  static fromRankItemArr(context: string, arr: IRankItem[], metadata?: IRankingMetadata) {
    return new Ranking({
      context: context,
      items: arr.map((ri: IRankItem) => ({ origin: ri.origin, pos: ri.pos })),
      teams: arr.map((ri: IRankItem) => ri.team),
      scores: arr.map((ri: IRankItem) => ri.score) as number[] | undefined,
      metadata,
    })
  }

  /**
   * Combina múltiples rankings en uno ponderado.
   * Cada team recibe un score = suma(peso * score_en_cada_ranking).
   * Teams sin score en un ranking fuente se tratan como score 0.
   * El ranking resultante se ordena por score descendente.
   * 
   * Solo se incluyen teams que aparecen en al menos uno de los rankings fuente.
   */
  static combine(
    context: string,
    sources: { ranking: Ranking; weight: number }[],
    metadata?: IRankingMetadata
  ): Ranking {
    // Acumular scores por team, indexado por team.id (un team lógico puede venir
    // como instancias distintas en cada ranking fuente, por eso NO se usa la
    // referencia del objeto como clave).
    const scoreMap = new Map<string, number>();
    const teamMap = new Map<string, Team>();

    sources.forEach(({ ranking, weight }) => {
      ranking.getRankTable().forEach((ri: IRankItem) => {
        const teamScore = ri.score ?? 0;
        const prev = scoreMap.get(ri.team.id) ?? 0;
        scoreMap.set(ri.team.id, prev + teamScore * weight);
        if (!teamMap.has(ri.team.id)) {
          teamMap.set(ri.team.id, ri.team);
        }
      });
    });

    // Ordenar por score descendente; desempate estable por team.id
    const sorted = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    const items: IGenericRankItem[] = sorted.map((_, idx) => ({
      origin: context,
      pos: idx + 1,
    }));
    const teams: Team[] = sorted.map(([id]) => teamMap.get(id)!);
    const scores: number[] = sorted.map(([, score]) => score);

    return new Ranking({ context, items, teams, scores, metadata });
  }

  /**
   * Crea un ranking histórico promediando scores de múltiples temporadas.
   * Busca en el store el ranking de cada temporada y pondera los scores.
   * 
   * Si weights no se provee, todas las temporadas pesan igual.
   * Teams que no aparecen en alguna temporada se tratan como score 0 para esa temporada.
   */
  static historical(
    context: string,
    store: RankingStore,
    baseContext: string,
    seasons: number[],
    weights?: number[],
    metadata?: IRankingMetadata
  ): Ranking {
    const w = weights ?? seasons.map(() => 1);
    const sources: { ranking: Ranking; weight: number }[] = [];

    seasons.forEach((season, idx) => {
      const ranking = store.getBySeason(baseContext, season);
      if (ranking) {
        sources.push({ ranking, weight: w[idx] });
      }
    });

    if (sources.length === 0) {
      return new Ranking({ context, items: [], teams: [], metadata });
    }

    return Ranking.combine(context, sources, metadata);
  }

  /**
   * Agrega múltiples rankings en uno unificado usando una función de score personalizada.
   * 
   * Recopila todos los teams únicos de los rankings provistos,
   * calcula el score de cada team usando scoreFn,
   * y ordena por score descendente.
   */
  static aggregate(
    context: string,
    rankings: Ranking[],
    scoreFn: (team: Team, rankings: Ranking[]) => number,
    metadata?: IRankingMetadata
  ): Ranking {
    // Recopilar teams únicos
    const teamMap = new Map<string, Team>();
    rankings.forEach(ranking => {
      ranking.getRankTable().forEach((ri: IRankItem) => {
        teamMap.set(ri.team.id, ri.team);
      });
    });

    // Calcular score y ordenar; desempate estable por team.id
    const scored = Array.from(teamMap.values())
      .map(team => ({ team, score: scoreFn(team, rankings) }))
      .sort((a, b) => b.score - a.score || a.team.id.localeCompare(b.team.id));

    const items: IGenericRankItem[] = scored.map((entry, idx) => ({
      origin: context,
      pos: idx + 1,
    }));
    const teams: Team[] = scored.map(entry => entry.team);
    const scores: number[] = scored.map(entry => entry.score);

    return new Ranking({ context, items, teams, scores, metadata });
  }

}