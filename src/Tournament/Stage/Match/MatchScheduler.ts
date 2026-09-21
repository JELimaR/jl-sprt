import { JCalendar, JDateTime } from "jl-calendar";
import { JEventMatch } from "./EventMatch";
import { A_Match } from "../../../jl-sprt-core";


export function MatchScheduler(match: A_Match<any>, dt: JDateTime, cal: JCalendar): JEventMatch {

  match.schedule(dt);

  // ANTES DE CREAR EL NUEVO EVENTO; TENER EN CUENTA QUE EL MISMO PUEDE EXISTIR; POR TANTO HAY QUE PODER VERIFICAR SI EL EVENTO COMO TAL YA EXISTE

  const event = new JEventMatch({
    dateTime: dt.getCreator(),
    calendar: cal,
    match: match,
  });
  cal.addEvent(event);
  return event;
}