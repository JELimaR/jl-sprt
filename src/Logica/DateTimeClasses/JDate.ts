import { TypeDayOfWeek, TypeMonthOfYear } from './types';
import {
  daysOfWeekNames,
  DAYSPEREVENMONTH,
  DAYSPERODDMONTH,
  DAYSPERWEEK,
  DAYSPERYEAR,
  HALFWEEKSPERMONTH,
  monthsOfYearNames,
} from './types';

export type TypeHalfWeekOfWeek = 'weekend' | 'middleweek';

export interface IJDate {
  dayName: string;
  monthName: string;
  dayAbsolute: number;
  dayOfYear: number;
  dayOfMonth: number;
  dayOfWeek: TypeDayOfWeek;
  halfWeekOfYear: number;
  halfWeekOfMonth: number;
  weekOfYear: number;
  monthOfYear: number;
  year: number;
  typeHalfWeek: TypeHalfWeekOfWeek;
  monthParity: 'evenMonth' | 'oddMonth';
}

export class JDate {
  private _dayAbsolute: number;

  constructor(day: number) {
    this._dayAbsolute = day;
  }

  addDay(): IJDate {
    this._dayAbsolute++;
    return this.getDate();
  }

  subDay(): IJDate {
    this._dayAbsolute--;
    return this.getDate();
  }

  getDate(): IJDate {
    const dayAbsolute = this._dayAbsolute;
    const dayOfYear = ((dayAbsolute - 1) % DAYSPERYEAR) + 1;
    const year = Math.floor((dayAbsolute - 1) / DAYSPERYEAR) + 1;
    const weekOfYear = Math.floor((dayOfYear - 1) / DAYSPERWEEK) + 1;
    const dayOfWeek: TypeDayOfWeek = ((dayOfYear - 1) % DAYSPERWEEK) + 1 as TypeDayOfWeek;
    const halfWeekOfYear = (weekOfYear - 1) * 2 + (dayOfWeek > 4 ? 2 : 1);
    const monthOfYear =
      Math.floor((halfWeekOfYear - 1) / HALFWEEKSPERMONTH) + 1 as TypeMonthOfYear;
    const dayOfMonthAux =
      ((dayOfYear - 1) % (DAYSPEREVENMONTH + DAYSPERODDMONTH)) + 1;
    const dayOfMonth = dayOfMonthAux > 32 ? dayOfMonthAux - 32 : dayOfMonthAux;
    const halfWeekOfMonth = ((halfWeekOfYear - 1) % HALFWEEKSPERMONTH) + 1;

    return {
      dayName: daysOfWeekNames[dayOfWeek],
      monthName: monthsOfYearNames[monthOfYear],
      dayAbsolute,
      dayOfYear,
      dayOfMonth,
      dayOfWeek,
      halfWeekOfYear,
      halfWeekOfMonth,
      weekOfYear,
      monthOfYear,
      year,
      typeHalfWeek: dayOfWeek <= 4 ? 'middleweek' : 'weekend',
      monthParity: monthOfYear % 2 === 1 ? 'oddMonth' : 'evenMonth',
    };
  }
}
