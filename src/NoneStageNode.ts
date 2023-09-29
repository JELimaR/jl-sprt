import { StageNode } from "./nodes";

export abstract class NoneStageNode extends StageNode {
  constructor(
    nid: string,
    participants: number,
  ) {
    super(nid, participants)
  }
  getHwsNumber(): number {
    return 0;
  }
}
export class TableStageNode extends NoneStageNode {
  constructor(
    nid: string,
    participants: number,
    public qNumber: number
  ) {
    super(nid, participants);
    if (participants > qNumber) {
      throw new Error(`en una TableStageNode el qNumber ${qNumber} debe ser menor al numero de participants ${participants}`);
    }
  }
  getRanksGroups(): number[] {
    return [
      this.qNumber,
      this.participants - this.qNumber
    ]
  }
}

export class TransferStageNode extends NoneStageNode {
  getRanksGroups(): number[] {
    return [this.participants];
  }
}