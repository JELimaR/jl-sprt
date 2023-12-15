import { IGenericRankItem } from "../data/Ranking/interfaces";
import { Ranking } from "../data/Ranking/Ranking";
import { IGenericRank, sizeGeneric } from "../interfaces";
import { GeneralStageGraph } from "./GeneralStageGraph";

export interface IANodeData {
  id: string;
  nodeLvl: number;
}
export abstract class ANode<D extends IANodeData> {

  private _data: D;

  constructor(data: D) {
    this._data = data;
  }

  getId(): string { return this._data.id };
  get data(): D { return this._data }
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
export class RankGroupNode extends ANode<IRankGroupNode> {

  getRanksGroups(): Ranking[] {
    return [this.data.sourceData];
  }
}
