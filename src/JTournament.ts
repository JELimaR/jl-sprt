import JStage, { IJStageInfo } from './JStage';

export type TypeJCategory = '1' | '2'; // ver

type TypeTeamList = {[K in TypeJCategory]?: any/*JTeam*/};

class JInstitution {
	_id: string = Math.floor(Math.random()*1000000).toString();
	// _local: JLocality | undefined;
	_teams: TypeTeamList = {};
	constructor() {

	}

	get id(): string {return this._id}

}
/********************* */

// para ver

export interface IJTournamentConfig {
	name: string;
	temp: number;
	category: TypeJCategory;
	qualified: JInstitution[]; // teams o institutions
	stages: IJStageInfo[];
}

export default class JTournament {
	_stages: JStage[] = [];
	_name: string;

	constructor(config: IJTournamentConfig) {
		this._name = config.name;
	}
}

