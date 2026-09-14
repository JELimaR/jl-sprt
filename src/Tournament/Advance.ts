import { JCalendar, JDateTime, JEvent, JDurativeEvent, DateToString } from "jl-calendar";
import { mostrarFecha } from "../mostrarFechaBorrar";

export function AdvanceAll(cal: JCalendar, GUARD: number = 5 * 300 * 378) {
  let idx: number = 0;
  let guard: number = 0;
  let NE = cal.getNextEvents();

  // while (!!NE) {

  //   const { dt, events } = NE;

  //   const INTERVALS = JDateTime.difBetween(dt, cal.now);
  //   cal.advanceIntervals(INTERVALS);
  //   NE.events.forEach((e) => console.log('ejecutando: ', e.label))

  //   while (cal.getActiveEvents().length > 0) {
  //     cal.tick();
  //     mostrarFecha(cal.now)
  //   }

  //   NE = cal.getNextEvents();
  //   if (++guard > GUARD) throw new Error(`advanceCalendar loop: ${cal.now}`);
  // }

  // while (!!NE) {

  //   const res = cal.advanceIntervals(1);
  //   // hacer algo con el tickresult
  //   NE = cal.getNextEvents();
  //   if (++guard > GUARD) throw new Error(`advanceCalendar loop: ${DateToString.Date_DDMMYYYY(cal.now.date)}`);
  // }

  while (!!NE && idx < cal.events.length) {

    const eve = cal.events[idx];

    console.log()
    console.log(`event index: ${idx}`)
    eve.execute();
    mostrarFecha(eve.dateTime);
    console.log('-------------------------------------------------------------------------------------------------')

    NE = cal.getNextEvents();
    idx++;
    if (++guard > GUARD) throw new Error(`advanceCalendar loop: ${cal.now.getDateTime().date}`);
  }
}
