
import { JDate, JDateTime, JTime } from "./JDateTimeModule";

export class DateToString {
  static Date_DDMMYYYY(date: JDate) {
    const { dayOfMonth, monthOfYear, year } = date.getDate();

    return `${stringPad(dayOfMonth)}-${stringPad(monthOfYear)}-${year}`;
  }

  static Date_ddd_DD_mmm_YYYY(date: JDate) {
    const { dayOfMonth, monthName, dayName, year } = date.getDate()

    return `${dayName} ${stringPad(dayOfMonth)} ${monthName} ${year}`;
  }

  static Time_HHMM(time: JTime) {
    const { hour, minutes } = time.getTime()

    return `${stringPad(hour)}:${stringPad(minutes)}`;
  }

  static Date_HW(date: JDate) {
    return `HW: ${stringPad(date.getDate().halfWeekOfYear)}`;
  }

  static DateTime_ddd_DD_mmm_YYYY_HHMM_HW(date: JDateTime) {

    return `${this.Date_ddd_DD_mmm_YYYY(date.date)} ${this.Time_HHMM(date.time)} - ${this.Date_HW(date.date)}`;
  }
}

const stringPad = (n: number, pad: number = 2) => {
  return `${String(n).padStart(pad, '0')}`
}