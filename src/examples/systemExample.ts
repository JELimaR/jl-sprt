
import JCalendar from "../JCalendar/JCalendar";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import SportServerAPI from "../JSportServerModule";
import mostrarFecha from "../mostrarFechaBorrar";
import stageExampleData from "./stageExampleData";

const {
  s1,
  s4,
} = stageExampleData;

export default function systemExample() {

  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1156, 168).getIJDateTimeCreator());
  mostrarFecha(cal.now)

  const ssapi = SportServerAPI();

}