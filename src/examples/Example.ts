
import { JCalendar, JDateTime } from "jl-calendar";
import mostrarFecha from "../mostrarFechaBorrar";

export default function Example() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1986).getIJDateTimeCreator());

  mostrarFecha(cal.now)
}