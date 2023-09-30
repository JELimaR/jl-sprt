import { IGenericRank, sizeGeneric } from "../JSportModule/interfaces";

export interface IANodeData {
  id: string;
  nodeLvl: number;
}
export abstract class ANode<D extends IANodeData> {

  private _data: D;
  private _usedGroups: number = 0;
  constructor(data: D) {
    this._data = data;
  }

  getId(): string { return this._data.id };
  get data(): D { return this._data }
  abstract getRanksGroups(): number[];

  useNextUpperGroup(): number {
    let out = this.getRanksGroups()[this._usedGroups]
    this._usedGroups++;
    return out;
  }
  useNextUnderGroup(): number {
    let out = this.getRanksGroups()[this.getRanksGroups().length - this._usedGroups - 1]
    this._usedGroups++;
    return out;
  }
  areAllUsed(): boolean { return this._usedGroups == this.getRanksGroups().length }
}
/******************************************************************************************************************* */
export interface IInitialNodeData extends IANodeData {
  id: 'ini';
  nodeLvl: 0;
  rankGroups: IGenericRank[];
}
export class InitialNode extends ANode<IInitialNodeData> {
  constructor(data: IInitialNodeData) {
    super(data);
  }

  getRanksGroups(): number[] {
    return this.data.rankGroups.map(igr => sizeGeneric(igr));
  }
}

export interface IFinalNodeData extends IANodeData {
  id: 'fin';
  nodeLvl: 0;
  rankGroups: IGenericRank[];
}
export class FinalNode extends ANode<IFinalNodeData> {
  constructor(data: IFinalNodeData) {
    super(data);
  }

  getRanksGroups(): number[] {
    return this.data.rankGroups.map(igr => sizeGeneric(igr));
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

}
/******************************************************************************************************************* */
export interface IRankGroupNode extends IANodeData {}
export class RankGroupNode extends ANode<IRankGroupNode> {

  getRanksGroups(): number[] {
    throw new Error("Method not implemented.");
  }
}
