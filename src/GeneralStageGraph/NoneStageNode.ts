import { IStageNodeData, StageNode } from "./nodes";

export abstract class NoneStageNode<D extends IStageNodeData> extends StageNode<D> {
  getHwsNumber(): number {
    return 0;
  }
}

export interface ITableStageNodeData extends IStageNodeData {
  qNumber: number;
}
export class TableStageNode extends NoneStageNode<ITableStageNodeData> {
  constructor(data: ITableStageNodeData) {
    super(data)
    if (data.participants > data.qNumber) {
      throw new Error(`en una TableStageNode el qNumber ${data.qNumber} debe ser menor al numero de participants ${data.participants}`);
    }
  }
  getRanksGroups(): number[] {
    return [
      this.data.qNumber,
      this.data.participants - this.data.qNumber
    ]
  }
}

export class TransferStageNode extends NoneStageNode<IStageNodeData> {
  getRanksGroups(): number[] {
    return [this.data.participants];
  }
}