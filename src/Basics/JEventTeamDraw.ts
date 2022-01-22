import { CollectionsUtilsFunctions } from "jl-utlts";
import { IJEventInfo, JEvent } from "../Calendar/Event/JEvent";
import JTeam from "./JTeam";
import JLeague from "./JLeague";

const CUF = CollectionsUtilsFunctions.getInstance();

export interface IJEventTeamDrawInfo extends IJEventInfo {
    league: JLeague;
    teams: JTeam[]
  }
  
  export class JEventTeamDraw extends JEvent {
    // evento que implica una configuracion necesaria
    private _league: JLeague;
    private _teams: JTeam[];
    constructor(etc: IJEventTeamDrawInfo) {
      super(etc);
      this._league = etc.league;
      this._teams = etc.teams;
    }
  
    ejecute() {
      console.log('ejecuting teams draw');
      let teamsDrawed: JTeam[] = (true) // cambiar por algo de config
				? CUF.shuffled<JTeam>(this._teams, 0)
				: this._teams; 
      this._league.assign(teamsDrawed, this.calendar);
      console.log('end teams draw');
    }
  }