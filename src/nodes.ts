import { TypeBaseStageOption } from "./JSportModule";

export class Federation_Div01Node {
  constructor(
    public fid: string,
    public ranksGroupsLength: number, // una opcion
  ) { }
}
//
export abstract class StageNode {
  private _usedGroups: number = 0;
  constructor(
    public sid: string,
    public participants: number,
  ) { }

  getId() { return this.sid }
  abstract getRanksGroups(): number[];
  abstract getHwsNumber(): number;

  useNextGroup(): number {
    let out = this.getRanksGroups()[this._usedGroups]
    this._usedGroups++;
    return out;
  }
  areAllUsed(): boolean { return this._usedGroups == this.getRanksGroups().length }
}
//
