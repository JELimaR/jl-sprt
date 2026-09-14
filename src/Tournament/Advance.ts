import { JCalendar, JDateTime, JEvent, JDurativeEvent, DateToString } from "jl-calendar";
import { mostrarFecha } from "../mostrarFechaBorrar";

export function AdvanceAll(cal: JCalendar, GUARD: number = 5 * 300 * 378) {
  
  advanceAll_1(cal, GUARD);
  // advanceAll_2(cal, GUARD);
  // advanceAll_3(cal, GUARD);

}

// Version 1: advanceIntervals
function advanceAll_1(cal: JCalendar, GUARD: number) {
  let guard: number = 0;
  let NE = cal.getNextEvents();
  while (
    !!NE ||
    cal.getCurrentEventList().length > 0 ||
    cal.getActiveEvents().length > 0
  ) {
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

    NE = cal.getNextEvents();
    if (++guard > GUARD) throw new Error(`advanceCalendar loop: ${DateToString.Date_DDMMYYYY(cal.now.date)}`);
  }
}

// Version 2: tick
function advanceAll_2(cal: JCalendar, GUARD: number) {
  let guard: number = 0;
  let NE = cal.getNextEvents();
  while (
    !!NE ||
    cal.getCurrentEventList().length > 0 ||
    cal.getActiveEvents().length > 0
  ) {
    const res = cal.tick();

    if (!res.advanced && res.pending.length > 0) {
      throw new Error(
        `advanceCalendar detenido por evento pendiente en ${DateToString.Date_DDMMYYYY(cal.now.date)}`
      );
    }

    NE = cal.getNextEvents();
    if (++guard > GUARD) throw new Error(`advanceCalendar loop: ${DateToString.Date_DDMMYYYY(cal.now.date)}`);
  }
}

// Version 3: idx + execute
function advanceAll_3(cal: JCalendar, GUARD: number) {
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