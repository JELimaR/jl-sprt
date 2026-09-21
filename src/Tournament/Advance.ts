import { JCalendar, JDateTime, JEvent, JDurativeEvent, DateToString } from "jl-calendar";
import { mostrarFecha } from "../mostrarFechaBorrar";

export function AdvanceAll(cal: JCalendar, GUARD: number = 5 * 300 * 378) {
  
  advanceToNext(cal, GUARD);
  // advanceAnyTick(cal, GUARD);
  // exectuteAllEvents(cal, GUARD);

}

// Version 1: advanceIntervals
function advanceToNext(cal: JCalendar, GUARD: number) {
  let guard: number = 0;
  while (cal.hasEventsToProcess()) {
    const NE = cal.getNextEvents();
    if (NE) {
      const intervals = JDateTime.difBetween(NE.dt, cal.now) - 1;
      if (intervals > 0) cal.advanceIntervals(intervals);
    }

    const res = cal.tick();
    if (!res.advanced && res.pending.length > 0) {
      throw new Error(
        `advanceCalendar detenido por evento pendiente en ${DateToString.Date_DDMMYYYY(cal.now.date)}`
      );
    }

    if (++guard > GUARD) throw new Error(`advanceCalendar loop: ${DateToString.Date_DDMMYYYY(cal.now.date)}`);
  }
}

// Version 2: tick
function advanceAnyTick(cal: JCalendar, GUARD: number) {
  let guard: number = 0;
  while (cal.hasEventsToProcess()) {
    const res = cal.tick();

    if (!res.advanced && res.pending.length > 0) {
      throw new Error(
        `advanceCalendar detenido por evento pendiente en ${DateToString.Date_DDMMYYYY(cal.now.date)}`
      );
    }

    if (++guard > GUARD) throw new Error(`advanceCalendar loop: ${DateToString.Date_DDMMYYYY(cal.now.date)}`);
  }
}

// Version 3: idx + execute
function exectuteAllEvents(cal: JCalendar, GUARD: number) {
  let guard: number = 0;
  let NE = cal.getNextEvents();
  let idx: number = 0;

  while (!!NE && idx < cal.events.length) {
    const eve = cal.events[idx];

    console.log();
    console.log(`event index: ${idx}`);
    eve.execute();
    mostrarFecha(eve.dateTime);
    console.log('-------------------------------------------------------------------------------------------------');

    NE = cal.getNextEvents();
    idx++;
    if (++guard > GUARD) throw new Error(`advanceCalendar loop: ${DateToString.Date_DDMMYYYY(cal.now.date)}`);
  }
}