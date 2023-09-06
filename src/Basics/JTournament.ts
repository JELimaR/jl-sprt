import { JEventStageGroupCreator } from './Stage/StageGroup/JEventStageGroupCreator';
import { JRankCalculator, JRankItem, TypeRanking } from './Rank/JRank';
import { JEventCreator } from '../Calendar/Event/JEventCreator';
import JCalendar from '../Calendar/JCalendar';
import { IJObserver } from '../patterns/observer';
import JStageParallels, { TypeStageParallelInfo, TypeSubStageInfo } from './Stage/JStageParallels';
import JSubStage from './Stage/JSubStage';
import { JEventStagePlayoffCreator } from './Stage/StagePlayoff/JEventStagePlayoffCreator';
import { TypeJCategory } from './types';

export interface IJTournamentConfig {
	entity: any;
	name: string;
	season: number;
	category: TypeJCategory;
	participantsRank: JRankItem[];
}

// se debe determinar el ranking en cada stage una vez que esta termina
export default class JTournament implements IJObserver<JEventCreator<JSubStage>> {
	_stages: JStageParallels[] = [];
	_stagesInfoList: TypeStageParallelInfo[] = [];
	_currentStage: JSubStage | undefined;
	_config: IJTournamentConfig;

	constructor(config: IJTournamentConfig, typeStages: TypeStageParallelInfo[], cal: JCalendar, participants: JRankItem[]/*, manager: TManagr*/) {
		// hacer verificaciones
		this._config = config;
		this._config.participantsRank = participants

		typeStages.forEach((stageInfo: TypeStageParallelInfo, idx: number) => {

			this._stagesInfoList.push({ ...stageInfo });
			this._stagesInfoList[idx].stageId = idx;
			
			let parallel: JStageParallels = new JStageParallels(this._config,	stageInfo);
			this._stages[idx] = parallel;
			if (idx > 0) parallel.prevStage = this._stages[idx-1];

			parallel.forEachSubStageInfo((subStageInfo: TypeSubStageInfo, lvl?: number) => {
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
	}

	get stages(): JStageParallels[] { return this._stages }
	get config(): IJTournamentConfig { return this._config }

	get rank(): TypeRanking {
		let stagesNumber: number = this._stages.length;
		if (stagesNumber > 0) {
			const parallel: JStageParallels = this._stages[stagesNumber-1];
			return JRankCalculator.getRankStageParallel(parallel)
		}
		return {
			state: 'partial',
			table: this._config.participantsRank
		}
	}

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

