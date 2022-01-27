import JBombo from './Basics/JBombo';
import { JEventStageGroupCreator } from './Basics/JEventStageGroupCreator';
import { JEventStagePlayoffCreator } from './Basics/JEventStagePlayoffCreator';
import JTeam from './Basics/JTeam';
import { JRankItem } from './Basics/Rank/JRank';
import { JEventCreator } from './Calendar/Event/JEventCreator';
import JCalendar from './Calendar/JCalendar';
import { IJObserver } from './patterns/observer';
import { JEvent } from './Calendar/Event/JEvent';
import JStageParallels, { TypeStageParallelInfo, TypeSubStageInfo } from './Basics/Stage/JStageParallels';
import JSubStage from './Basics/Stage/JSubStage';

export type TypeJCategory = '1' | '2'; // ver

type TypeTeamList = { [K in TypeJCategory]?: any/*JTeam*/ };

// class JInstitution {
// 	_id: string = Math.floor(Math.random()*1000000).toString();
// 	// _local: JLocality | undefined;
// 	_teams: TypeTeamList = {};
// 	constructor() {

// 	}

// 	get id(): string {return this._id}

// }
/********************* */

// para ver



export interface IJTournamentConfig {
	entity: any;
	name: string;
	season: number;
	category: TypeJCategory;
	participantsRank: JRankItem[];
	// nextStageQualified: JBombo<JTeam>[]; // teams
}

// se debe determinar los clasificados en cada stage una vez que esta termina
export default class JTournament implements IJObserver<JEventCreator<JSubStage>> {
	_stages: JStageParallels[] = [];
	_stagesInfoList: TypeStageParallelInfo[] = [];
	// _newParticipantsPerStage: Array<JTeam[]> = [];
	_currentStage: JSubStage | undefined;
	_config: IJTournamentConfig;

	constructor(config: IJTournamentConfig, typeStages: TypeStageParallelInfo[], cal: JCalendar/*, manager: TManagr*/) {
		// hacer verificaciones
		this._config = config;
		// let inTheRace: JTeam[] = [...this._config.participantsRank].map(item => item.team);

		typeStages.forEach((stageInfo: TypeStageParallelInfo, idx: number) => {

			this._stagesInfoList.push({ ...stageInfo });
			this._stagesInfoList[idx].stageId = idx;
			
			let parallel: JStageParallels = new JStageParallels(this._config,	stageInfo);
			this._stages[idx] = parallel;
			if (idx > 0) parallel.prevStage = this._stages[idx-1];

			parallel.forEachSubStageInfo((subStageInfo: TypeSubStageInfo) => {
				let events: JEventCreator<JSubStage>[] = [];
				switch (subStageInfo.type) {
					case 'group':
						events = [new JEventStageGroupCreator({
							dateTime: subStageInfo.info.createDate,
							calendar: cal,
							tournament: this,
							stageGroupConfig: subStageInfo.info,
							stageId: parallel.info.stageId
						})]
						break;
					case 'playoff':
						events = [new JEventStagePlayoffCreator({
							dateTime: subStageInfo.info.createDate,
							calendar: cal,
							tournament: this,
							stagePlayoffConfig: subStageInfo.info,
							stageId: parallel.info.stageId
						})]
						break;
					default:
						throw new Error(`evento no creado`)
				}
				events.forEach((eve: JEventCreator<JSubStage>) => {
					cal.addEvent(eve);
					eve.addObserver(this);
				})
			})

		})
		// if (inTheRace.length > 0) throw new Error(`en constructor de torunament`)
	}

	get stages(): JStageParallels[] { return this._stages }
	get config(): IJTournamentConfig { return this._config }

	// get newParticipantsPerStage(): Array<JTeam[]> {
	// 	return this._newParticipantsPerStage;
	// }

	get currentStage(): JSubStage | undefined {
		return this._currentStage
	}
	newStageCreated(stage: JSubStage): void {
		// this._stages[stage.config.stageId] = stage;
		this._currentStage = stage;
	}
	update(ecs: JEventCreator<JSubStage>): void {
		const id: number = ecs.element.stageId;
		this._stages[id].addStage(ecs.element);
		this._currentStage = ecs.element;
	}
}

