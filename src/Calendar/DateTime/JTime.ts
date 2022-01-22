import { TypeHourOfDay, TypeMinutesOfHour } from './types';

export interface IJTime {
  minutes: number;
  hour: number;
  interv: number;
}

export class JTime {
  private _interv: number;

  constructor(interv: number) {
    if (interv > 300) console.error('non compatible');
    this._interv = interv % 300;
  }

  addInterv(): boolean {
    this._interv = (this._interv + 1) % 300;
    return this._interv === 0;
  }

  subInterv(): boolean {
    this._interv = (this._interv + 299) % 300;
    return this._interv === 299;
  }

  getTime(): IJTime {
    return {
      minutes: (((this._interv % 300) % 12) * 5) as TypeMinutesOfHour,
      hour: Math.floor((this._interv % 300) / 12) as TypeHourOfDay,
      interv: this._interv,
    };
  }
}
