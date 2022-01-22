import { IJEventCreatorInfo, JEventCreator } from "../Calendar/Event/JEventCreator";
import JLeague, { IJLeagueConfig } from './JLeague';
import { JEventTeamDraw } from "./JEventTeamDraw";
import { teamSelection } from "../GlobalData";
import { IJDateTimeCreator, JDateTime } from '../Calendar/DateTime/JDateTime';

export interface IJEventLeagueCreatorInfo extends IJEventCreatorInfo {
  leagueConfig: IJLeagueConfig;
}

export class JEventLeagueCreator extends JEventCreator<JLeague> {
  // evento que implica una configuracion necesaria
  private _leagueConfig: IJLeagueConfig;
  constructor(eclbc: IJEventLeagueCreatorInfo) {
    super(eclbc);
    this._leagueConfig = eclbc.leagueConfig;
  }
  ejecute() {
    // setear datos en algun momento, si no se seteo nada debe dar error o solicitarlo
    this.element = new JLeague(this._leagueConfig);
		let dt: JDateTime = new JDateTime({ day: 1, interv: 200 });
		if (!JDateTime.isAminorthanB(this.dateTime, dt)) {
			dt = this.dateTime.copy();
			dt.addInterv();
		}
    this.calendar.addEvent(
      new JEventTeamDraw({
        dateTime: dt.getIJDateTimeCreator(),
        calendar: this.calendar,
        league: this.element,
        teams: teamSelection(this.element.config.partsNumber)
      })
    );
		this.notify();
		this.state = 'realised';
  }
}