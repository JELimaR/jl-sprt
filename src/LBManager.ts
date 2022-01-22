import { CollectionsUtilsFunctions } from 'jl-utlts';
const CUF = CollectionsUtilsFunctions.getInstance();

import { JFech } from './Basics/Fech/JFech';
import { JEventLeagueCreator } from './Basics/JEventLeagueCreator';
import JLeague, { IJLeagueConfig } from './Basics/JLeague';
import { dataCreateLB } from './GlobalData';
import { JDateTime } from './Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from './Calendar/DateTime/types';
import { JEvent } from './Calendar/Event/JEvent';
import JCalendar from './Calendar/JCalendar';
import { IJObserver } from './patterns/observer';

/************************************************************************/
export default class LBManager implements IJObserver<JEventLeagueCreator> {
  public lb: JLeague | undefined;
  public dt: JDateTime = new JDateTime({ day: 1, interv: 0 });
  public calendar: JCalendar = new JCalendar();

  constructor() {
		const event: JEventLeagueCreator = new JEventLeagueCreator({
			dateTime: { day: 3, interv: 100 },
			calendar: this.calendar,
			leagueConfig: dataCreateLB(),
		});
		event.addObserver(this);
    this.calendar.addEvent( event );
  }

  get nextEvent(): JEvent | null {
    return this.calendar.events.filter(
      (event: JEvent) => event.dateTime.absolute > this.dt.absolute
    )[0];
  }

  advance(): JEvent | null {
    this.dt.addInterv(1);
    return this.nextEvent;
  }

  getEventNow(dt?: JDateTime): JEvent[] {
    return this.calendar.events.filter(
      (event: JEvent) => event.dateTime.absolute === this.dt.absolute
    );
  }

	update(elbc: JEventLeagueCreator): void {
		this.lb = elbc.element;
	}

}
