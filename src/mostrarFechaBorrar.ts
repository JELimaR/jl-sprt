import { DateToString } from "./JCalendar";
import { JDateTime } from "./JCalendar/JDateTimeModule";

export default function mostrarFecha(dt: JDateTime) {
  console.log(DateToString.DateTime_ddd_DD_mmm_YYYY_HHMM_HW(dt));
}
