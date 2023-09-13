import { IJDateTimeCreator, JDateTime } from "./DateTime/JDateTime";
import { JEvent } from "./Event/JEvent";
import { Event_Creator } from "./Event/Event_Creator";

export default class JCalendar {
    private _events: JEvent[] = [];
    private _initDate: JDateTime;
    private _now: JDateTime;

    constructor(dti: IJDateTimeCreator) {
        this._now = new JDateTime(dti);
        this._initDate = this._now.copy();
    }

    addEvent(event: JEvent) {
        this._events.push(event);
        this._events.sort((a: JEvent, b: JEvent) => {
        	return JDateTime.difBetween(a.dateTime, b.dateTime);
        });
    }

    get now(): JDateTime { return this._now }
    set now(dt: JDateTime) { 
        this._now = dt.copy()
    }

    get init(): JDateTime { return this._initDate }

    get events(): JEvent[] {
        // cambiar a IJEvent?
        return this._events;
    }

}