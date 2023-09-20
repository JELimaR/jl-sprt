import { TypeHourOfDay, TypeIntervOfDay, TypeMinutesOfHour, INTERVSPERHOUR } from './types';

export interface IJTime {
  minutes: number;
  hour: number;
  interv: TypeIntervOfDay;
}

export class JTime {
  private _interv: TypeIntervOfDay;

  constructor(interv: TypeIntervOfDay) {
    this._interv = interv % 300 as TypeIntervOfDay;
  }

  addInterv(): boolean {
    this._interv = (this._interv + 1) % 300 as TypeIntervOfDay;
    return this._interv === 0;
  }

  subInterv(): boolean {
    this._interv = (this._interv + 299) % 300 as TypeIntervOfDay;
    return this._interv === 299;
  }

  getTime(): IJTime {
    return {
      minutes: (((this._interv % 300) % 12) * 5) as TypeMinutesOfHour,
      hour: Math.floor((this._interv % 300) / 12) as TypeHourOfDay,
      interv: this._interv,
    };
  }

  static intervFromHourOfDayAndMinutesOfHour(hour: TypeHourOfDay, mins: TypeMinutesOfHour): TypeIntervOfDay {
    return hour * INTERVSPERHOUR + mins / 5 as TypeIntervOfDay;
  }
}
