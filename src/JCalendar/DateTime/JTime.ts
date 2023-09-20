import { TypeHourOfDay, TypeIntervalOfDay, TypeMinutesOfHour, INTERVSPERHOUR } from './types';

export interface IJTime {
  minutes: number;
  hour: number;
  interv: TypeIntervalOfDay;
}

export class JTime {
  private _interv: TypeIntervalOfDay;

  constructor(interv: TypeIntervalOfDay) {
    this._interv = interv % 300 as TypeIntervalOfDay;
  }

  addInterv(): boolean {
    this._interv = (this._interv + 1) % 300 as TypeIntervalOfDay;
    return this._interv === 0;
  }

  subInterv(): boolean {
    this._interv = (this._interv + 299) % 300 as TypeIntervalOfDay;
    return this._interv === 299;
  }

  getTime(): IJTime {
    return {
      minutes: (((this._interv % 300) % 12) * 5) as TypeMinutesOfHour,
      hour: Math.floor((this._interv % 300) / 12) as TypeHourOfDay,
      interv: this._interv,
    };
  }

  static intervFromHourOfDayAndMinutesOfHour(hour: TypeHourOfDay, mins: TypeMinutesOfHour): TypeIntervalOfDay {
    return hour * INTERVSPERHOUR + mins / 5 as TypeIntervalOfDay;
  }
}
