import { JDateTime } from "./DateTime/JDateTime";
import { JEvent } from "./Event/JEvent";
import { JEventCreator } from "./Event/JEventCreator";

export default class JCalendar {
    private _events: JEvent[] = [];
    private _now: JDateTime = new JDateTime({day: 1, interv: 0}); // usar en el constructor

    constructor() {}

    addEvent(event: JEvent) {
        this._events.push(event);
        this._events.sort((a: JEvent, b: JEvent) => {
        	return JDateTime.difBetween(a.dateTime, b.dateTime);
        });
    }

    get now(): JDateTime { return this._now }
    set now(dt: JDateTime) { this._now = dt.copy() }

    get events(): JEvent[] {
        // cambiar a IJEvent?
        return this._events;
    }

}