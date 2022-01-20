import { CollectionsUtilsFunctions } from "jl-utlts";
import { IJEventInfo, JEvent } from "../Logica/Event/JEvent";
import JTeam from "./JTeam";
import LB from "./LB";

const CUF = CollectionsUtilsFunctions.getInstance();

export interface IJEventTeamDrawInfo extends IJEventInfo {
    lb: LB;
    teams: JTeam[]
  }
  
  export class JEventTeamDraw extends JEvent {
    // evento que implica una configuracion necesaria
    private _lb: LB;
    private _teams: JTeam[];
    constructor(etc: IJEventTeamDrawInfo) {
      super(etc);
      this._lb = etc.lb;
      this._teams = etc.teams;
    }
  
    ejecute() {
      console.log('ejecuting team assignation');
      let teamsDrawed: JTeam[] = CUF.shuffled<JTeam>(this._teams, 0)
      this._lb.assign(teamsDrawed, this.calendar);
      console.log('end team assignation');
    }
  }