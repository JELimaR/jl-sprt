import { IJEventCreatorInfo, JEventCreator } from "../Calendar/Event/JEventCreator";
import { JStageGroup,  IJStageGroupInfo} from '../JStage'
import { JEventStageGroupTeamsDraw } from "./JEventStageGroupTeamsDraw";
import { firstStageGroupTeamSelection } from "../GlobalData";
import { IJDateTimeCreator, JDateTime } from '../Calendar/DateTime/JDateTime';

export interface IJEventStageGroupCreatorInfo extends IJEventCreatorInfo {
  StageGroupConfig: IJStageGroupInfo;
}

export class JEventStageGroupCreator extends JEventCreator<JStageGroup> {
  // evento que implica una configuracion necesaria
  private _StageGroupConfig: IJStageGroupInfo;
  constructor(ecgsc: IJEventStageGroupCreatorInfo) {
    super(ecgsc);
    this._StageGroupConfig = ecgsc.StageGroupConfig;
  }
  ejecute() {
    // setear datos en algun momento, si no se seteo nada debe dar error o solicitarlo
    this.element = new JStageGroup(this._StageGroupConfig);
		let dt: JDateTime = new JDateTime({ day: 1, interv: 200 });
		if (!JDateTime.isAminorthanB(this.dateTime, dt)) {
			dt = this.dateTime.copy();
			dt.addInterv();
		}
    this.calendar.addEvent(
      new JEventStageGroupTeamsDraw({
        dateTime: dt.getIJDateTimeCreator(),
        calendar: this.calendar,
        stageGroup: this.element,
        bombos: firstStageGroupTeamSelection(this.element.config)
      })
    );
		this.notify();
		this.state = 'realised';
  }
}