import { DAYSPERYEAR, TypeDayOfYear, TypeHalfWeekOfYear, TypeIntervOfDay, TypeDateAndTimeOfYear } from './types';
import { IJDate, JDate } from './JDate';
import { IJTime, JTime } from './JTime';

export interface IJDateTime {
  date: IJDate;
  time: IJTime;
}

export interface IJDateTimeCreator {
  interv: TypeIntervOfDay;
  day: number;
}

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

  // set time(interv: TypeIntervOfDay) {
  //   this._time = new JTime(interv)
  // }

  get date(): JDate {return this._date}
  get time(): JTime {return this._time}

  getDateTime(): IJDateTime {
    return {
      date: this._date.getDate(),
      time: this._time.getTime(),
    };
  }

  getIJDateTimeCreator(): IJDateTimeCreator {
    return {
      day: this._date.getDate().dayAbsolute,
      interv: this._time.getTime().interv,
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

  copy(): JDateTime {
    return new JDateTime(this.getIJDateTimeCreator());
  }

  // statics
  static isAminorthanB(a: JDateTime, b: JDateTime): boolean {
    return this.difBetween(a, b) < 0;
  }
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
    return new JDateTime({
      day: dt.getDateTime().date.dayAbsolute - 7 * ws,
      interv: dt.getDateTime().time.interv,
    });
  }
  static halfWeekOfYearToDaysOfYear(hs: TypeHalfWeekOfYear): IJHalfWeekOfYear {
    let initWeek = Math.floor((hs + 1) / 2 - 1) * 7;
    const start: TypeDayOfYear = (initWeek +
      (hs % 2 === 1 ? 2 : 5)) as TypeDayOfYear;
    const end: TypeDayOfYear = (start +
      (hs % 2 === 1 ? 2 : 2)) as TypeDayOfYear;
    return {
      start,
      middle: (start + 1) as TypeDayOfYear,
      end,
    };
  }
  static createFromHalfWeekOfYearAndYear(hs: TypeHalfWeekOfYear, year: number, opt: 'start' | 'end' | 'middle', interv?: TypeIntervOfDay): JDateTime {
    const dayOfYear: TypeDayOfYear = this.halfWeekOfYearToDaysOfYear(hs)[opt];
    return this.createFromDayOfYearAndYear(dayOfYear, year, interv);
  }
  static createFromDayOfYearAndYear(day: TypeDayOfYear, year: number, interv: TypeIntervOfDay = 0): JDateTime {
    return new JDateTime({
      interv: interv,
      day: JDate.absolouteFromDayOfYearAndYear(day, year)
    });
  }
  static createFromTypeDateAndTimeOfYearAndYear(dt: TypeDateAndTimeOfYear, year: number): JDateTime {
    return new JDateTime({
      day: JDate.absolouteFromDayOfYearAndYear(dt.day, year),
      interv: JTime.intervFromHourOfDayAndMinutesOfHour(dt.hour, dt.mins)
    })
  }
}

export interface IJHalfWeekOfYear {
  start: TypeDayOfYear;
  middle: TypeDayOfYear;
  end: TypeDayOfYear;
}
