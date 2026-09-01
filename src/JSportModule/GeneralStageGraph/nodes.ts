import { IGenericRankItem } from "../Ranking";
import { Ranking } from "../Ranking";

// =============================================================================
// nodes.ts — nodos base del GeneralStageGraph (GSG)
//
// El GSG modela un torneo como un grafo dirigido donde el "flujo" son equipos
// (posiciones de un ranking). Este archivo define:
//   - ANode: la base de todos los nodos (id, nivel, y datos de dibujo x/y/color).
//   - InitialNode (INI) y FinalNode (FIN): entrada y salida del torneo.
//   - StageNode: base de las etapas (grupos/playoff) y pasos de procesamiento.
//   - RankGroupNode (RG): el nodo que "transporta" un ranking por una arista.
//
// Contrato clave: todo nodo implementa `getRanksGroups()`, que devuelve los
// rankings que ese nodo PRODUCE a su salida. Es lo que consume la arista hacia
// el siguiente nodo.
// =============================================================================

export interface IANodeData {
  id: string;
  nodeLvl: number;
}
/** Base de todos los nodos. Incluye atributos de layout (x, y, size, color, label)
 *  usados por el renderizado del grafo (renderGSGtoPNG) y por el futuro frontend. */
export abstract class ANode<D extends IANodeData> {

  private _data: D;
  x: number = 0;
  y: number = 0;
  size: number = 20;
  color: string = '#CCC'
  label: string = '';

  constructor(data: D) {
    this._data = data;
  }

  getId(): string { return this._data.id };
  get data(): D { return this._data }
  /** Rankings que este nodo produce a su salida (lo que fluye hacia el siguiente nodo). */
  abstract getRanksGroups(): Ranking[];

  // useNextUpperGroup(): number {
  //   let out = this.getRanksGroups()[this._usedGroups]
  //   this._usedGroups++;
  //   return out;
  // }
  // useNextUnderGroup(): number {
  //   let out = this.getRanksGroups()[this.getRanksGroups().length - this._usedGroups - 1]
  //   this._usedGroups++;
  //   return out;
  // }
  // areAllUsed(): boolean { return this._usedGroups == this.getRanksGroups().length }
}
/******************************************************************************************************************* */
export interface IInitialNodeData extends IANodeData {
  id: 'ini';
  tournamentId: string;
  nodeLvl: 0;
  qualyRankList: IGenericRankItem[];
  rankGroups: number[];
}
/**
 * InitialNode (INI) — punto de entrada del torneo.
 *
 * Declara CUÁNTOS equipos entran clasificados (`qualyRankList`) y cómo se
 * reparten en los rank groups iniciales (`rankGroups`, ej. [8, 2] = un grupo de
 * 8 y otro de 2). A su salida genera un Ranking por cada rankGroup.
 *
 * VALIDACIÓN: la suma de `rankGroups` debe ser igual a la cantidad de
 * clasificados. No se puede repartir en grupos una cantidad distinta de la que
 * realmente entra al torneo.
 */
export class InitialNode extends ANode<IInitialNodeData> {
  constructor(data: IInitialNodeData) {
    super(data);
    const rankGroupsTotal = data.rankGroups.reduce((partialSum, a) => partialSum + a, 0);
    if (rankGroupsTotal !== data.qualyRankList.length) {
      console.log('rankGroups', data.rankGroups);
      console.log('qualyRank', data.qualyRankList);
      throw new Error(
        `data.rankGroups ${data.rankGroups} debe tener la misma cantidad de elementos
        que la lista de clasificados: ${data.qualyRankList.length}`
      )
    }
  }

  /**
   * Reparte los clasificados en rankings consecutivos según `rankGroups`.
   * Ej: rankGroups [8, 2] -> dos rankings: posiciones 1..8 y 9..10.
   * Cada ranking usa el context 'ini_<tournamentId>'.
   */
  getRanksGroups(): Ranking[] {
    let current = 0;
    return this.data.rankGroups.map((n: number) => {
      let curr_aux = current;
      current += n;
      // console.log(this.data.qualyRank.getGenericRankItems().slice(curr_aux, curr_aux + n))
      return Ranking.fromQualyCondition({
        // context: 'ini',
        // items: this.data.qualyRankList.getGenericRankItems().slice(curr_aux, curr_aux + n),
        // teams: [],
        rankId: 'ini_' + this.data.tournamentId,
        season: 'current',
        minRankPos: curr_aux + 1,
        maxRankPos: curr_aux + n,
      })
    });
  }
}

export interface IFinalNodeData extends IANodeData {
  id: 'fin';
  nodeLvl: 0;
  // rankGroups: IGenericRank[];
}
/**
 * FinalNode (FIN) — punto de salida del torneo.
 * Solo RECIBE los rankings finales (a través de sus RankGroupNode source); no
 * produce rankings propios, por eso getRanksGroups() es vacío.
 */
export class FinalNode extends ANode<IFinalNodeData> {
  constructor(data: IFinalNodeData) {
    super(data);
  }

  getRanksGroups(): Ranking[] {
    return [];
  }
}

/******************************************************************************************************************* */
// export class Federation_Div01Node extends ANode {
//   getRanksGroups(): number[] {
//     throw new Error("Method not implemented.");
//   }
//   constructor(
//     public fid: string,
//     public ranksGroupsLength: number, // una opcion
//   ) {
//     super(0);
//   }

//   getId() { return this.fid }
// }
// generateFederations(14).forEach((fede: IFederationData, i: number) => {
//   const len = i < 2 ? 4 : 3;
//   const fedRank: Federation_Div01Node = new Federation_Div01Node(fede.id, len);
// })
/******************************************************************************************************************* */
/**
 * StageNode — base común de las etapas (RealStageNode: grupos/playoff) y de los
 * pasos de procesamiento (NoneStageNode: transfer/table/reorder). Todas conocen
 * su cantidad de `participants`.
 */
export interface IStageNodeData extends IANodeData {
  participants: number;
}
export abstract class StageNode<D extends IStageNodeData> extends ANode<D> {
  // abstract getRelativeRanking(gsg: GeneralStageGraph): Ranking[];
}
/******************************************************************************************************************* */
export interface IRankGroupNode extends IANodeData {
  sourceData: Ranking;
}
/**
 * RankGroupNode (RG) — el nodo "puerto" que transporta UN ranking por una arista.
 *
 * Los nodos de etapa/procesamiento crean automáticamente sus RankGroupNode de
 * salida (ver GeneralStageGraph.addNode). Toda arista del grafo conecta un
 * RankGroupNode con un no-RankGroupNode: el flujo es siempre
 * "grupo de ranking" -> "etapa" -> "grupo de ranking" -> ...
 */
export class RankGroupNode extends ANode<IRankGroupNode> {

  getRanksGroups(): Ranking[] {
    return [this.data.sourceData];
  }
}
