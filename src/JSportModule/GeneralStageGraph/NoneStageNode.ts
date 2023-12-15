import { Ranking } from "../data/Ranking/Ranking";
import { IStageNodeData, StageNode } from "./nodes";

export abstract class NoneStageNode<D extends IStageNodeData> extends StageNode<D> {

  constructor(data: D, public r: Ranking[]) {
    super(data);
  }

  getHwsNumber(): number {
    return 0;
  }
}

export interface ITableStageNodeData extends IStageNodeData {
  qNumber: number;
}
export class TableStageNode extends NoneStageNode<ITableStageNodeData> {
  constructor(data: ITableStageNodeData, r: Ranking[]) {
    super(data, r)
    if (data.participants > data.qNumber) {
      throw new Error(`en una TableStageNode el qNumber ${data.qNumber} debe ser menor al numero de participants ${data.participants}`);
    }
    if (r.length !== 1) {
      throw new Error(`en una TableStageNode  ${data.qNumber} debe ser igual a 1`);
    }
  }
  
  getRanksGroups(): Ranking[] {
    const firsts = this.r[0].getInterface().items.slice(0, this.data.qNumber);
    const lasts = this.r[0].getInterface().items.slice(this.data.qNumber);
    
    return [
      Ranking.fromTypeRanking({
        ...this.r[0].getInterface(),
        items: firsts,
      }),
      Ranking.fromTypeRanking({
        ...this.r[0].getInterface(),
        items: lasts,
      })
    ]
  }
  
}

export class TransferStageNode extends NoneStageNode<IStageNodeData> {
  getRanksGroups(): Ranking[] {
    return this.r;
  }
}

export class ReOrderStageNode extends NoneStageNode<IStageNodeData> {
  constructor(data: ITableStageNodeData, r: Ranking[]) {
    super(data, r)
    if (r.length !== 2) {
      throw new Error(`en una TableStageNode  ${data.qNumber} debe ser igual a 1`);
    }
  }

  getRanksGroups(): Ranking[] {
    return [this.r[1], this.r[0]];
  }
}