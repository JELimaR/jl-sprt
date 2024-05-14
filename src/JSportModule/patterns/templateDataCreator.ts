

export interface ITDCData { }

export interface ITDCCreator { }

export abstract class TDC<D extends ITDCData, C extends ITDCCreator> {
  private _info: C
  constructor(creator: C) {
    this._info = creator;
  }

  get info(): C { return this._info }

  abstract getData(): D;
}