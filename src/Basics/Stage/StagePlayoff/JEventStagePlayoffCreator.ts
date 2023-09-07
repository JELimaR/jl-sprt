// import { JDateTime } from "../../../Calendar/DateTime/JDateTime";
// import { IJEventCreatorInfo, JEventCreator } from "../../../Calendar/Event/JEventCreator";
// import Team from "../../Team";
// // import JTournament from "../../JTournament";
// import { JEventStagePlayoffTeamsDraw } from "./JEventStagePlayoffTeamsDraw";
// import JStagePlayoff, { IJStagePlayoffInfo } from "./JStagePlayoff";


// export interface IJEventStagePlayoffCreatorInfo extends IJEventCreatorInfo {
//   // tournament: JTournament;
//   stagePlayoffConfig: IJStagePlayoffInfo;
//   stageId: number;
// }

// export class JEventStagePlayoffCreator extends JEventCreator<JStagePlayoff> {
//   // evento que implica una configuracion necesaria
//   // private _tournament: JTournament;
//   private _stagePlayoffConfig: IJStagePlayoffInfo;
//   private _stageId: number;
//   constructor(espc: IJEventStagePlayoffCreatorInfo) {
//     super(espc);
//     // this._tournament = espc.tournament;
//     this._stagePlayoffConfig = espc.stagePlayoffConfig;
//     this._stageId = espc.stageId;
//   }

//   execute() {
//     // setear datos en algun momento, si no se seteo nada debe dar error o solicitarlo
//     this.element = new JStagePlayoff({
//       // tournamentConfig: this._tournament.config,
//       info: this._stagePlayoffConfig,
//       stageId: this._stageId
//     });
// 		let dt: JDateTime = new JDateTime(this._stagePlayoffConfig.drawDate);
// 		if (!JDateTime.isAminorthanB(this.dateTime, dt)) {
// 			dt = this.dateTime.copy();
// 			dt.addInterv();
// 		}

//     // determinar participants
//     const stageId: number = this._stageId;
//     if (stageId > 0) {
//       // this.element.prevStage = this._tournament.stages[stageId-1]; // se usa para calcular los clasificados
//     }
//     let participants: Team[] = [...this.element.qualified()];

//     this.calendar.addEvent(
//       new JEventStagePlayoffTeamsDraw({
//         dateTime: dt.getIJDateTimeCreator(),
//         calendar: this.calendar,
//         stagePlayoff: this.element,
//         bombos: this.element.getBombos(participants),
//       })
//     );
// 		this.notify();
// 		this.state = 'realised';
//   }
// }