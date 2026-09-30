
import { JCalendar, JDateTime } from "jl-calendar";
import { mostrarFecha } from "../mostrarFechaBorrar";

export function Example() {

  const cal = JCalendar.createFromYear(1986);

  mostrarFecha(cal.now)
}