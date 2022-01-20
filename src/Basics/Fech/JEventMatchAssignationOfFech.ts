import { JDateTime } from "../../Logica/DateTimeClasses/JDateTime";
import { IJEventInfo, JEvent } from "../../Logica/Event/JEvent";
import JMatch from "../Match/JMatch";
import { JEventMatch } from "../Match/JMatchEvent";
import { JFech } from "./JFech";


export interface IJEventMatchAssignationOfFechInfo extends IJEventInfo {
    fech: JFech;
  }
  
  export class JEventMatchAssignationOfFech extends JEvent {
    // evento que implica una configuracion necesaria
    _fech: JFech;
    constructor(efc: IJEventMatchAssignationOfFechInfo) {
      super(efc);
      this._fech = efc.fech;
    }
  
    ejecute() {
      console.log(`ejecuting match scheduling for fech number: ${this._fech.id}`);
      // el evento debe crearse en el match
      this._fech.matches.forEach((match: JMatch) => {
        const dt = JDateTime.halfWeekOfYearToDateTime(
          this._fech.halfWeek,
          1,
          'end'
        );
        match.schedule(dt);
        this.calendar.addEvent(
          new JEventMatch({
            dateTime: dt.getIJDateTimeCreator(),
            calendar: this.calendar,
            match,
          })
        );
      });
    }
  }