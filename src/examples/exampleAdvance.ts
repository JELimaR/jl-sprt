import { JCalendar, JEvent } from "jl-calendar";
import mostrarFecha from "../mostrarFechaBorrar";

const exampleAdvance = (cal: JCalendar) => {
  let idx: number = 0;
  while (cal.getNextEvents().events.length !== 0) {

    const { dt, events } = cal.getNextEvents()
    // hay que decirle al cal que día es antes de empezar a ejecutar cada evento
    cal.now = dt
    events.forEach((eve: JEvent) => {
      console.log();
      console.log(`event index: ${idx}`);

      eve.execute();
      mostrarFecha(eve.dateTime);
      console.log('-------------------------------------------------------------------------------------------------')
      idx++;
    })
  }
}

export default exampleAdvance;