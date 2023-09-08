// import { IJEventCreatorInfo, JEventCreator } from "../../../Calendar/Event/JEventCreator";

// import { JEventStageGroupTeamsDraw } from "./JEventStageGroupTeamsDraw";
// import { JDateTime } from '../../../Calendar/DateTime/JDateTime';
// import JTeam from "../../JTeam";
// import JTournament from "../../JTournament";
// import JStageGroup, { IJStageGroupInfo } from "./JStageGroup";

// export interface IJEventStageGroupCreatorInfo extends IJEventCreatorInfo {
//   tournament: JTournament; // se debe hacer de otra forma
//   stageGroupConfig: IJStageGroupInfo;
//   stageId: number;
// }

// export class JEventStageGroupCreator extends JEventCreator<JStageGroup> {
//   // evento que implica una configuracion necesaria
//   private _tournament: JTournament;
//   private _stageGroupConfig: IJStageGroupInfo;
//   private _stageId: number;

//   constructor(ecgsc: IJEventStageGroupCreatorInfo) {
//     super(ecgsc);
//     this._tournament = ecgsc.tournament;
//     this._stageGroupConfig = ecgsc.stageGroupConfig;
//     this._stageId = ecgsc.stageId;
//   }

//   execute() {
//     // setear datos en algun momento, si no se seteo nada debe dar error o solicitarlo
//     this.element = new JStageGroup({
//       tournamentConfig: this._tournament.config,
//       info: this._stageGroupConfig,
//       stageId: this._stageId
//     });
// 		let dt: JDateTime = new JDateTime(this._stageGroupConfig.drawDate);
// 		if (!JDateTime.isAminorthanB(this.dateTime, dt)) {
// 			dt = this.dateTime.copy();
// 			dt.addInterv();
// 		}

//     // determinar participants
//     const stageId: number = this._stageId;
//     if (stageId > 0) {
//       this.element.prevStage = this._tournament.stages[stageId-1]; // se usa para calcular los clasificados
//     }
//     let participants: JTeam[] = [...this.element.qualified()];
//     // participants = participants.concat(
//     //   this._tournament.newParticipantsPerStage[stageId]
//     // );

//     console.log(participants);
//     console.log(this.element.qualified());

//     this.calendar.addEvent(
//       new JEventStageGroupTeamsDraw({
//         dateTime: dt.getIJDateTimeCreator(),
//         calendar: this.calendar,
//         stageGroup: this.element,
//         bombos: this.element.getBombos(participants), // otra forma
//       })
//     );
// 		this.notify();
// 		this.state = 'realised';
//   }
// }