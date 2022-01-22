import { CollectionsUtilsFunctions } from 'jl-utlts';
const CUF = CollectionsUtilsFunctions.getInstance();

import { JFech } from './Basics/Fech/JFech';
import {  JEventStageGroupCreator } from './Basics/JEventStageGroupCreator';
import JLeague, { IJLeagueConfig } from './Basics/JLeague';
import { firstStageGroup } from './GlobalData';
import { JDateTime } from './Calendar/DateTime/JDateTime';
import { TypeHalfWeekOfYear } from './Calendar/DateTime/types';
import { JEvent } from './Calendar/Event/JEvent';
import JCalendar from './Calendar/JCalendar';
import { IJObserver } from './patterns/observer';
import {JStageGroup} from './JStage'

/************************************************************************/
export default class GSManager implements IJObserver<JEventStageGroupCreator> {
  public sg: JStageGroup | undefined;
  public dt: JDateTime = new JDateTime({ day: 1, interv: 0 });
  public calendar: JCalendar = new JCalendar();

  constructor() {
		const event: JEventStageGroupCreator = new JEventStageGroupCreator({
			dateTime: { day: 3, interv: 100 },
			calendar: this.calendar,
			StageGroupConfig: firstStageGroup(),
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

	update(elbc: JEventStageGroupCreator): void {
		this.sg = elbc.element;
	}

}