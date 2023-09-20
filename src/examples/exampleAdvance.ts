import JCalendar from "../JCalendar/JCalendar";
import mostrarFecha from "../mostrarFechaBorrar";

const exampleAdvance = (cal: JCalendar) => {
  let idx: number = 0;
  while (idx < cal.events.length) {
    console.log();
    console.log(`event index: ${idx}`);

    const eve = cal.events[idx];
    eve.execute();
    mostrarFecha(eve.dateTime);
    console.log('-------------------------------------------------------------------------------------------------')
    idx++;
  }
}

export default exampleAdvance;