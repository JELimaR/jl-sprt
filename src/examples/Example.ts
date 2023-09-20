import { JDateTime } from "../JCalendar/DateTime/JDateTime";
import JCalendar from "../JCalendar/JCalendar";
import mostrarFecha from "../mostrarFechaBorrar";

export default function Example() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());

  mostrarFecha(cal.now)
}