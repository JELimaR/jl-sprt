import { JDateTime, IJDateTimeCreator } from "./JDateTimeModule";

export default class DateTimeController {
  private _now: JDateTime;
  constructor(dtcreator: IJDateTimeCreator) {
    this._now = new JDateTime(dtcreator);
  }

  get now(): JDateTime { return this._now.copy() }
}