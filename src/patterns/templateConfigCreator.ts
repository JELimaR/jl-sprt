

export interface ITCCInfo {
  id: string;
}

export interface ITCCConfig {
  idConfig: string;
  name: string;
}

export interface ITCCDATA<I extends ITCCInfo, C extends ITCCConfig> {
  info: I;
  config: C;
}

export class TCC<I extends ITCCInfo, C extends ITCCConfig> {
  private _info: I;
  private _config: C;
  constructor(info: I, config: C) {
    this._info = info;
    this._config = config;
  }

  get info(): I { return this._info }
  get config(): C { return this._config }

  getData(): ITCCDATA<I, C> { return {info: this._info, config: this._config} }
}