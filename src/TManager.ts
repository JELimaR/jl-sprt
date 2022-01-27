// import { CollectionsUtilsFunctions } from 'jl-utlts';
// const CUF = CollectionsUtilsFunctions.getInstance();

import { teamSelection } from './GlobalData';
import { JDateTime } from './Calendar/DateTime/JDateTime';
import { JEvent } from './Calendar/Event/JEvent';
import JCalendar from './Calendar/JCalendar';
import { IJObserver } from './patterns/observer';
import { JEventCreator } from './Calendar/Event/JEventCreator';
import JTournament, { IJTournamentConfig } from './JTournament';
import { TypeStageParallelInfo } from './Basics/Stage/JStageParallels';
import JSubStage from './Basics/Stage/JSubStage';

/**
 * se crea IJTorunamentConfig como ejemplo
 */

const prueba = (pn: number, gn: number): number[] => {
  if (pn / gn < 3) throw new Error(`parts number: ${pn} and groups: ${gn}`)
  let out: number[] = [];

  const divUp = Math.ceil(pn / gn);
  const divDown = Math.floor(pn / gn);
  console.log('div up', divUp);
  console.log('div down', divDown);

  let total = pn;
  if (divDown !== divUp) {
    if (divUp % 2 !== 0) throw new Error(`no puede haber gr de ${divUp} y de ${divDown} en un mismo stagegroup`)
    total = total - divUp;
    out.push(divUp);
    while (total % divDown !== 0) {
      total = total - divUp;
      out.push(divUp);
    }
  }
  while (total !== 0) {
    total = total - divDown;
    out.push(divDown);
  }

  console.log(out);

  return out;
}

const selection = teamSelection(32).map((t, idx) => { return { team: t, rank: idx + 1 } })

const configExample: IJTournamentConfig = {
  entity: 'hellos',
  category: '1',
  name: 'my fisrt tournament',
  participantsRank: selection, // el numero de parts debe ser igual a la suma de participantsNumber.news de cada stage
  // nextStageQualified: [],
  season: 1,
}

const stagesExample: TypeStageParallelInfo[] = [
  {
    stageId: 0,
    one: {
      type: 'group',
      info: {
        participantsNumber: 24,
        prevQualies: { rankPosMin: 9, rankPosMax: 32 },
        createDate: { day: 1, interv: 1 },
        initDate: { day: 20, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 5, interv: 0 },
        isIV: true,
        allowedDraw: true,
        rankMinValue: 9,
        bombos: [ // la suma de cant debe ser igual al total de partsNumber y la suma de selection debe ser igual al max participant per group
          { cant: 4, selectionPerTime: 1 },
          { cant: 4, selectionPerTime: 1 },
          { cant: 8, selectionPerTime: 2 },
          { cant: 8, selectionPerTime: 2 },
        ],
        groupsNumber: 4,
        participantsPerGroup: prueba(24, 4),
        drawRulesValidate: [],
        fechHalfWeeks: [
          20, 22, 24, 26, 27, 28, 30, 32, 35, 38,
        ],
        fechHalfWeeksSchedule: [
          10, 10, 10, 10, 10, 20, 22, 24, 26, 27
        ],
      }
    }
  },
  {
    stageId: 1,
    one: {
      type: 'group', // ultimos
      info: {
        participantsNumber: 16,
        prevQualies: { rankPosMin: 1, rankPosMax: 16 },
        createDate: { day: 150, interv: 0 },
        initDate: { day: 155, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 152, interv: 0 },
        isIV: true,
        allowedDraw: true,
        rankMinValue: 1,
        bombos: [
          { cant: 8, selectionPerTime: 2 },
          { cant: 4, selectionPerTime: 1 },
          { cant: 4, selectionPerTime: 1 },
        ],
        groupsNumber: 4,
        participantsPerGroup: prueba(16, 4),
        drawRulesValidate: [],
        fechHalfWeeks: [
          65, 66, 67, 68, 70, 72
        ],
        fechHalfWeeksSchedule: [
          65, 65, 65, 65, 65, 65
        ],
      }
    },
  },
  {
    stageId: 2,
    one: {
      type: 'playoff',
      info: {
        roundsNumber: 2, // calcular clasificados
        participantsNumber: 8,
        prevQualies: { rankPosMin: 1, rankPosMax: 8 }, // max + 1 - min debe ser igual a participantsNumber
        createDate: { day: 300, interv: 0 }, // debe crearse luego de terminada la anterior (finalDate) debido a que cuando se crea, se determinan los participantes
        initDate: { day: 301, interv: 0 }, // debe iniciar luego de drawDate
        finalDate: { day: 350, interv: 0 }, // debe c
        drawDate: { day: 300, interv: 150 }, // debe ser luego de que se crea y antes de iniciarse
        isIV: true,
        rankMinValue: 1,
        bombos: [
          { cant: 4, selectionPerTime: 1 }, // siempre es uno
          { cant: 4, selectionPerTime: 1 }, // siempre es uno
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [ // el ultimo debe ser previo a final date
          [92, 94], [95, 96],
        ],
        roundHalfWeeksSchedule: [
          90, 95
        ],
      }
    }
  },
  {
    stageId: 3,
    one: {
      type: 'playoff',
      info: {
        roundsNumber: 1,
        participantsNumber: 2,
        prevQualies: { rankPosMin: 1, rankPosMax: 2 },
        createDate: { day: 348, interv: 0 },
        initDate: { day: 344, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 348, interv: 150 },
        isIV: false,
        rankMinValue: 1,
        bombos: [
          { cant: 2, selectionPerTime: 1 }, // siempre es uno
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [ // cambiar a round
          [103, 103],
        ],
        roundHalfWeeksSchedule: [
          101
        ],
      }
    },
    two: {
      type: 'playoff',
      info: {
        roundsNumber: 1,
        participantsNumber: 2,
        prevQualies: { rankPosMin: 3, rankPosMax: 4 },
        createDate: { day: 348, interv: 0 },
        initDate: { day: 344, interv: 0 },
        finalDate: { day: 350, interv: 0 },
        drawDate: { day: 348, interv: 150 },
        isIV: false,
        rankMinValue: 3,
        bombos: [
          { cant: 2, selectionPerTime: 1 }, // siempre es uno
        ],
        drawRulesValidate: [],
        roundHalfWeeks: [ // cambiar a round
          [103, 103],
        ],
        roundHalfWeeksSchedule: [
          101
        ],
      }
    }
  }
]
/************************************************************************/
export default class TManager implements IJObserver<JEventCreator<JSubStage>> {
  public _trn: JTournament;
  //public dt: JDateTime = new JDateTime({ day: 1, interv: 0 });
  public _calendar: JCalendar = new JCalendar();

  constructor() {
    console.log(configExample);
    console.log(stagesExample);
    this._trn = new JTournament(configExample, stagesExample, this._calendar);

  }

  getNextEvent(dt: JDateTime): JEvent | null {
    return this._calendar.events.filter(
      (event: JEvent) => event.dateTime.absolute > dt.absolute
    )[0];
  }

  /*advance(): JEvent | null {
    this.dt.addInterv(1);
    return this.getNextEvent();
  }*/

  getEventNow(dt: JDateTime): JEvent[] {
    return this._calendar.events.filter(
      (event: JEvent) => event.dateTime.absolute === dt.absolute
    );
  }

  update(esc: JEventCreator<JSubStage>): void {
    console.log(esc);
  }

}