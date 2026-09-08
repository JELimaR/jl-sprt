import { JCalendar, JDateTime, JEvent } from "jl-calendar";
import mostrarFecha from "../mostrarFechaBorrar";

const exampleAdvance = (cal: JCalendar) => {
  let idx: number = 0;
  // let NE = cal.getNextEvents();
  // while (!!NE && NE.events.length !== 0) {

  //   const { dt, events } = NE;
  //   // hay que decirle al cal que día es antes de empezar a ejecutar cada evento
  //   const INTERVALS = JDateTime.difBetween(dt, cal.now);
  //   cal.advanceIntervals(INTERVALS);

  //   NE = cal.getNextEvents();
  // }

  let NE = cal.getNextEvents();
  while (!!NE && idx < cal.events.length) {

    const eve = cal.events[idx];
    
    console.log()
    console.log(`event index: ${idx}`)
    eve.execute();
    mostrarFecha(eve.dateTime);
    console.log('-------------------------------------------------------------------------------------------------')

    NE = cal.getNextEvents();
    idx++;
  }
}

export default exampleAdvance;