import { DAYSPERYEAR } from './types';
import { IJDate, JDate } from './JDate';
import { IJTime, JTime } from './JTime';

export interface IJDateTime {
  date: IJDate;
  time: IJTime;
}

export interface IJDateTimeCreator { interv: number; day: number }


export class JDateTime {
  private _time: JTime;
  private _date: JDate;
  constructor(ent: IJDateTimeCreator) {
    this._date = new JDate(ent.day);
    this._time = new JTime(ent.interv);
  }

  get absolute(): number {
    return this._date.getDate().dayAbsolute * 300 + this._time.getTime().interv;
  }

  getDateTime(): IJDateTime {
    return {
      date: this._date.getDate(),
      time: this._time.getTime(),
    };
  }

  addInterv(value: number = 1): void {
    for (let i = 0; i < value; i++) {
      if (this._time.addInterv()) {
        this._date.addDay();
      }
    }
  }

  subInterv(): void {
    if (this._time.subInterv()) {
      this._date.subDay();
    }
  }

  addDay() {
    this._date.addDay();
  }

  subDay() {
    this._date.subDay();
  }

  // statics
  static difBetween(a: JDateTime, b: JDateTime): number {
    return a.absolute - b.absolute;
  }
  static nextYearBegin(dt: JDateTime): JDateTime {
    return new JDateTime({
      interv: 0,
      day: DAYSPERYEAR * dt._date.getDate().year + 1,
    });
  }
  static subWeeks(dt: JDateTime, ws: number): JDateTime {
    return new JDateTime({day: dt.getDateTime().date.dayAbsolute - 7*ws, interv: dt.getDateTime().time.interv})
  }
}
