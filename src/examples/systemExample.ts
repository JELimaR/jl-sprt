
import JCalendar from "../JCalendar/JCalendar";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import SportServerAPI from "../JSportServerModule";
import mostrarFecha from "../mostrarFechaBorrar";

export default function systemExample() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1156, 168).getIJDateTimeCreator());
  mostrarFecha(cal.now)

  const api = SportServerAPI();
  console.log(api)
  console.log(api.getAllConfederations())
  
}