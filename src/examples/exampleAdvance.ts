import { JEvent } from "../JCalendar/Event/JEvent";
import JCalendar from "../JCalendar/JCalendar";
import { JEventMatch } from "../JSportModule/Match/JEventMatch";
import mostrarFecha from "../mostrarFechaBorrar";
import { Event_StageEnd } from "../Tournament/Stage/Event_StageEnd";
import Event_RoundCreationAndTeamsDraw from "../Tournament/Stage/StagePlayoff/SingleElimination/Event_RoundCreationAndTeamsDraw";
import { Event_ScheduleOfRoundMatches } from "../Tournament/Stage/StagePlayoff/SingleElimination/Event_ScheduleOfRoundMatches";

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