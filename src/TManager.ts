// import JTournament from "./Tournament/Tournament";
// import { JDateTime } from "./Calendar/DateTime/JDateTime";
// import { JEvent } from "./Calendar/Event/JEvent";
// import JCalendar from "./Calendar/JCalendar";
// import exampleSet01 from "./ExampleTrn/exampleSet01";
// import exampleSet02 from "./ExampleTrn/exampleSet02";

// // const exampleSet = exampleSet01;
// const exampleSet = exampleSet02;

// export default class TManager/* implements IJObserver<JEventCreator<JSubStage>>*/ {
//   public _trn: JTournament;
//   //public dt: JDateTime = new JDateTime({ day: 1, interv: 0 });
//   public _calendar: JCalendar;

//   constructor() {
//     // console.log(exampleSet.tournamentconfig);
//     // console.log(exampleSet.stages);
//     this._calendar = new JCalendar({
//       day: 1,
//       interv: 0
//     });
    
//     this._trn = new JTournament(
//       // exampleSet.tournamentconfig,
//       // exampleSet.stages,
//       // this._calendar,
//       // exampleSet.participantsRank
//     );

//   }

//   getNextEvent(dt: JDateTime): JEvent | null {
//     return this._calendar.events.filter(
//       (event: JEvent) => event.dateTime.absolute > dt.absolute
//     )[0];
//   }

//   /*advance(): JEvent | null {
//     this.dt.addInterv(1);
//     return this.getNextEvent();
//   }*/

//   getEventNow(dt: JDateTime): JEvent[] {
//     return this._calendar.events.filter(
//       (event: JEvent) => event.dateTime.absolute === dt.absolute
//     );
//   }

//   // update(esc: JEventCreator<JSubStage>): void {
//   //   console.log(esc);
//   // }

// }