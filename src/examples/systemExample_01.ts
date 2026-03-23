
import { getExampleTeams } from "./ExampleData";
import { JEvent } from "../JCalendar/Event/JEvent";
import JCalendar from "../JCalendar/JCalendar";
import { IJDateTimeCreator, JDateTime } from "../JCalendar/JDateTimeModule";
import { IFederationData, IGenericRankItem, IRankItem, ITournamentConfig, Ranking, TypeRanking } from "../JSportModule";
import Team from "../JSportModule/data/Team";
import { GeneralStageGraph } from "../JSportModule/GeneralStageGraph/GeneralStageGraph";
import { createGSG, TInitialCreator, TPhaseCreator } from "../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData, tournamentFromGSG } from "../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { FootballProfile } from "../JSportModule/profiles/football/FootballProfile";
import SportServerAPI from "../JSportServerModule";
import mostrarFecha from "../mostrarFechaBorrar";
import { asignarTeams2 } from "../Tournament/asignarTeams2";
import { globalFinishedRankingsMap } from "../Tournament/globalFinishedRankingsMap";
import Tournament from "../Tournament/Tournament";
import exampleAdvance from "./exampleAdvance";

/********************************************************************************* */
class FednAux {
  private _id: string;
  private _areaAsosiatedId: string;
  private _founderIds: string[];
  private _headquarters: string;
  private _dateTimeCreation: number;
  private _institutions: Team[]; // cambiar a institutions
  private _divisionSystem: any;

  constructor(info: IFederationData, teams: Team[]) {
    this._id = info.i;
    this._areaAsosiatedId = info.aa;
    this._founderIds = info.fs;
    this._headquarters = info.hq;
    this._dateTimeCreation = info.fd;

    this._institutions = [...teams]; // buscar los teams
    this._divisionSystem = info.lSys
  }

  addInstitution(inst: Team): boolean {
    this._institutions.push(inst)
    return true;
  }

  getRanking(): Ranking {
    const rankArr: IRankItem[] = this._institutions.map((inst: Team, i: number) => {
      return {
        origin: this._id, pos: i + 1, team: inst
      }
    })
    return Ranking.fromRankItemArr(`fr_S_${this._id}`, rankArr)
  }

  get dateTimeCreation(): IJDateTimeCreator {
    return {day: this._dateTimeCreation, interv: 100}
  }

  updateRanking(rank: Ranking) {
    const instPrevList = [...this._institutions];
    const rankTeams = rank.getRankTable().map(iri => iri.team)
    for (let i = 0; i < rankTeams.length; i++) {
      this._institutions[i] = rankTeams[i];
    }
    // verifico que todos siguen estando
    instPrevList.forEach((elem: Team) => {
      if (!this._institutions.includes(elem)) {
        console.log(this._institutions.map(e => e.id))
        throw new Error(`en la lista de instituciones no se incluye el elemento: ${elem.id}.
        En Federation.updateRanking`)
      }
    })
  }
}

const fid = `F${String(1).padStart(3, '0')}`;
const fteams = getExampleTeams(18, fid);

const federation = new FednAux({
  i: fid, aa: 'A_C001', fs: [], ms: [], hq: 'hq_F001',
  fd: 1118,
  lSys: {},
  cSys: {},
  rnks: {},
  n: 'Federation N' + fid,
  sn: 'F' + fid,
}, fteams.slice(0, 8))

/*********************************************************************************** */

export default function systemExample_01() {


  const ssapi = SportServerAPI();
  const franking = federation.getRanking();
  globalFinishedRankingsMap.set(franking.context, franking);

  const Y_END = 1164;
  for (let Y = 1158; Y <= Y_END; Y++) {
    console.log('-------------------------------', Y, '------------------------------------')
    const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, Y, 168).getIJDateTimeCreator());
    mostrarFecha(cal.now)
    // defino los configs
    let t1_data: ITournamentFromGSGData;
    let t2_data: ITournamentFromGSGData | undefined;
    // let gsg_1: GeneralStageGraph;
    // let gsg_2: GeneralStageGraph | undefined;

    if (Y < 1161) {
      t1_data = config_1156;
      // gsg_1 = gsg_1156;
    } else {
      // los nuevos equipos pasan a integrar el ranking de la federacion
      t1_data = config_1161;
      // gsg_1 = gsg_1161;
      t2_data = config_1161_2d
      // gsg_2 = gsg_1161_2d
    }

    // if (t2_data) {
    //   console.log(t1_data)
    //   console.log(gsg_1._phases)
    //   console.log(t2_data)
    //   console.log(gsg_2!._phases)
    //   throw new Error(`parar`)
    // }


    // creo los tournaments y creo su ranking inicial
    let t1 = Tournament.create({ id: 'L1', season: Y }, t1_data, cal, new FootballProfile())
    console.log(t1.config)
    let t2: Tournament | undefined;
    // asignarTeams(gsg_1)
    asignarTeams2(t1)
    if (t2_data) {
      t2 = Tournament.create({ id: 'L2', season: Y }, t2_data, cal, new FootballProfile())
      console.log(t2.config)
      asignarTeams2(t2)
    }

    // avance
    exampleAdvance(cal)
    console.log(cal.events.length)

    // muestreo
    console.table(t1.getRelativeRank().getRankTable().map(iri => { return { ...iri, team: iri.team.id } }))
    t1.stagesMap.forEach(s => {
      let tabla = s.getTable('finished')
      console.table(tabla.map(tti => tti.getInterface()))
    })

    if (t2) {
      console.table(t2.getRelativeRank().getRankTable().map(iri => { return { ...iri, team: iri.team.id } }))
      t2.stagesMap.forEach(s => {
        let tabla = s.getTable('finished')
        console.table(tabla.map(tti => tti.getInterface()))
      })
    }

    globalFinishedRankingsMap.forEach((value: Ranking, key: string) => {
      console.log(key, value.size)
    })
    // actualizar ranking
    if (!t2) {
      const t1_ranking = t1.getRelativeRank()
      federation.updateRanking(t1_ranking);
    } else {
      const t1_ranking = t1.getRelativeRank()
      const t2_ranking = t2.getRelativeRank()

      const arr: IRankItem[] = [
        ...t1_ranking.getRankTable().slice(0, 8),
        ...t2_ranking.getRankTable().slice(0, 2),
        ...t1_ranking.getRankTable().slice(8, 10),
        ...t2_ranking.getRankTable().slice(2, 18),
      ]

      federation.updateRanking(
        Ranking.fromRankItemArr('no importa', arr)
      )

    }
    if (Y == 1160) {
      fteams.slice(8, 18).forEach((t: Team) => {
        federation.addInstitution(t)
      })
      console.log(federation)
    }
    globalFinishedRankingsMap.clear()

    let f01_ranking = federation.getRanking()
    globalFinishedRankingsMap.set(f01_ranking.context, f01_ranking)
    globalFinishedRankingsMap.forEach((value: Ranking, key: string) => {
      console.log(key, value.size)
    })
  }

  console.log('La federation fue creada en:')
  mostrarFecha((new JDateTime(federation.dateTimeCreation)))

}

/************************************************************************************************************ */
// año 1156 a 1160
const iniCreator_1156: TInitialCreator = {
  tournamentId: 'S_F001_D01',
  qualyrankList: [
    { origin: 'fr_S_F001', pos: 1 },
    { origin: 'fr_S_F001', pos: 2 },
    { origin: 'fr_S_F001', pos: 3 },
    { origin: 'fr_S_F001', pos: 4 },
    { origin: 'fr_S_F001', pos: 5 },
    { origin: 'fr_S_F001', pos: 6 },
    { origin: 'fr_S_F001', pos: 7 },
    { origin: 'fr_S_F001', pos: 8 },
  ],
  rankGroupNumbers: [8]
};

const phaseCreatorArr_1156: TPhaseCreator[] = [
  {
    id: 1,
    stages: [
      { count: 1, stage: { type: 'group', opt: 'h&a', value: 1, draw: { interv: 18, rules: [] } } }
    ]
  }
]

const config_1156: ITournamentFromGSGData = {
  name: 'Lig',
  gsgData: { initialCreator: iniCreator_1156, phaseArr: phaseCreatorArr_1156 },
  matchList: [28, 32, 36, 40, 44, 48, 52, 70, 74, 78, 82, 86, 90, 94],
  schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
  qualyRules: []
}

/************************************************************************************************************ */
// año 1161
const iniCreator_1161: TInitialCreator = {
  tournamentId: 'S_F001_D01',
  qualyrankList: [
    { origin: 'fr_S_F001', pos: 1 },
    { origin: 'fr_S_F001', pos: 2 },
    { origin: 'fr_S_F001', pos: 3 },
    { origin: 'fr_S_F001', pos: 4 },
    { origin: 'fr_S_F001', pos: 5 },
    { origin: 'fr_S_F001', pos: 6 },
    { origin: 'fr_S_F001', pos: 7 },
    { origin: 'fr_S_F001', pos: 8 },
    { origin: 'fr_S_F001', pos: 9 },
    { origin: 'fr_S_F001', pos: 10 },
  ],
  rankGroupNumbers: [10]
};

const phaseCreatorArr_1161: TPhaseCreator[] = [
  {
    id: 1,
    stages: [
      { count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }
    ]
  }
]

const config_1161: ITournamentFromGSGData = {
  name: 'Lig',
  gsgData: { initialCreator: iniCreator_1161, phaseArr: phaseCreatorArr_1161 },
  matchList: [28, 32, 36, 40, 44, 48, 52, 56, 60, 70, 74, 78, 82, 86, 90, 94, 98, 102],
  schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 62, 62, 62, 62, 62, 62, 62, 62, 62],
  qualyRules: [
    { minRankPos: 1, maxRankPos: 1 },
    { minRankPos: 9, maxRankPos: 10 },
  ]
};
// 2 div
const iniCreator_1161_2d: TInitialCreator = {
  tournamentId: 'S_F001_D02',
  qualyrankList: [
    { origin: 'fr_S_F001', pos: 11 },
    { origin: 'fr_S_F001', pos: 12 },
    { origin: 'fr_S_F001', pos: 13 },
    { origin: 'fr_S_F001', pos: 14 },
    { origin: 'fr_S_F001', pos: 15 },
    { origin: 'fr_S_F001', pos: 16 },
    { origin: 'fr_S_F001', pos: 17 },
    { origin: 'fr_S_F001', pos: 18 },
  ],
  rankGroupNumbers: [8]
};

const phaseCreatorArr_1161_2d: TPhaseCreator[] = [
  {
    id: 1,
    stages: [
      { count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }
    ]
  },
  {
    id: 2,
    stages: [
      { count: 1, stage: { type: 'transfer' } },
      { count: 2, stage: { type: 'playoff', opt: 'neutral', value: 1 } },
      { count: 5, stage: { type: 'transfer' } },
    ]
  }
]

const config_1161_2d: ITournamentFromGSGData = {
  name: 'Lig2',
  gsgData: { initialCreator: iniCreator_1161_2d, phaseArr: phaseCreatorArr_1161_2d },
  matchList: [30, 34, 38, 42, 46, 50, 54, 64, 68, 72, 76, 80, 84, 88, 91],
  schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 89],
  qualyRules: [
    { minRankPos: 1, maxRankPos: 1 },
    { minRankPos: 1, maxRankPos: 2 },
  ]
}