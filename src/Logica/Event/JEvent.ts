import { IJDateTimeCreator, JDateTime } from "../DateTimeClasses/JDateTime";
import JCalendar from "../JCalendar";

export interface IJEventInfo {
    dateTime: IJDateTimeCreator;
    calendar: JCalendar;
  }
  
export abstract class JEvent {
    private _dateTime: JDateTime;
    private _calendar: JCalendar;
        private _state: 'created' | 'process' | 'finished';

    constructor(ec: IJEventInfo) {
        this._dateTime = new JDateTime(ec.dateTime);
        this._calendar = ec.calendar;
            this._state = 'created';
    }

    get dateTime(): JDateTime {
        return this._dateTime;
    }
    get calendar(): JCalendar {
        return this._calendar;
    }

    /*abstract*/ advance() { // para los eventos que duran mas de un intervalo y tienen acciones y estados
        console.log('advance event');
    }

    abstract ejecute(): void;
}