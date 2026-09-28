import { JCalendar, JDateTime } from "jl-calendar";
import { JEventMatch } from "./EventMatch";
import { AnyMatch } from "jl-sprt-core";


export function MatchScheduler(match: AnyMatch, dt: JDateTime, cal: JCalendar): JEventMatch {

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