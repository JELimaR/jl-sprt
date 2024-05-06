
import JCalendar from "../JCalendar/JCalendar";
import { JDateTime } from "../JCalendar/JDateTimeModule";
import { CATEGORIES, Country, Federation, IFederationCreator, IGenericRankItem, Ranking, Town, TypeCategory, TypeCategoryList } from "../JSportModule";
import { IInstitutionCreator, Institution } from "../JSportModule/data/Entities/Institution";
import LeagueSystem, { IDivisionCondition, ILeagueSystemCreator } from "../JSportModule/data/Entities/LeagueSystem";
import Team from "../JSportModule/data/Team";
import { TInitialCreator, TPhaseCreator } from "../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData, tournamentFromGSG } from "../JSportModule/GeneralStageGraph/tournamentFromGSG";
import mostrarFecha from "../mostrarFechaBorrar";
import { asignarTeams2 } from "../Tournament/asignarTeams2";
import { globalFinishedRankingsMap } from "../Tournament/Rank/globalFinishedRankingsMap";
import Tournament from "../Tournament/Tournament";
import exampleAdvance from "./exampleAdvance";
import { getFederationCreators, getInstitutionCreators } from "./ExampleData";

/**
 * Sistema con una unica federation
 */

const federationFileLS = new Map<number, TypeCategoryList<ILeagueSystemCreator>>()
const federationFileMembers = new Map<number, IInstitutionCreator[]>()


export default function fede_inst_Example() {
  const federationCreator = getFederationCreators(14)[13];
  const federation = new Federation(federationCreator);
  const institutions = getInstitutionCreators(8, federation.areaAsosiated.id);
  institutions.forEach((iic: IInstitutionCreator) => {
    const institution = new Institution(iic);
    federation.addMember(institution);
    institution.createTeam('S');
    federation.addInstitutionToCategory(institution, 'S')
  })

  // nuevas institutions
  getInstitutionCreators(18, federation.areaAsosiated.id).forEach((iic: IInstitutionCreator, idx: number) => {
    if (idx >= 8) {
      const arr: IInstitutionCreator[] = federationFileMembers.get(1159) ? federationFileMembers.get(1159)! : []
      arr.push(iic)
      federationFileMembers.set(1159, arr)
    }
  })

  console.log('federationFileLS')
  console.log(federationFileLS)

  let cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, 1154, 168).getIJDateTimeCreator());
  for (let Y = 1154; Y <= 1166; Y++) {
    console.log('-------------------------------', Y, '------------------------------------')
    cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, Y, 168).getIJDateTimeCreator());
    mostrarFecha(cal.now)
    // actualizo la cantidad institutions
    // nuevas institutions asociadas a una federation
    const newMembers = federationFileMembers.get(Y)
    if (newMembers) {
      newMembers.forEach((newMember: IInstitutionCreator) => {
        const institution = new Institution(newMember);
        federation.addMember(institution)
        institution.createTeam('S');
        federation.addInstitutionToCategory(institution, 'S')
      })
    }
    // nuevas institutions participantes en alguna categoria

    // genero los nuevos rankings
    const franking: Ranking = federation.getRanking('S')
    globalFinishedRankingsMap.set(franking.context, franking)

    // actualizo los ls de la federation
    const lsList = federationFileLS.get(Y)
    if (!!lsList) {
      CATEGORIES.forEach((category: TypeCategory) => {
        const ilsc = lsList[category]
        if (!!ilsc) {
          const ls = new LeagueSystem(ilsc)
          federation.updateLeagueSystem(ls)
        }
      })
    }

    // creo los tournaments de federations
    const tournamentList: Tournament[] = []
    federation.createTournamentList().forEach((tournamentFromGSG: ITournamentFromGSGData, i: number) => {
      const t = Tournament.create({ id: tournamentFromGSG.name, season: Y }, tournamentFromGSG, cal)
      asignarTeams2(t)
      tournamentList.push(t)
    })

    exampleAdvance(cal)

    // muestro y grabo
    tournamentList.forEach((t) => {
      globalFinishedRankingsMap.set(t.getRelativeRank().context, t.getRelativeRank())
      console.log('------------------------------------------------------------------------------')
      console.log(t.info.id, t.info.season)
      console.table(t.getRelativeRank().getRankTable().map(iri => { return { ...iri, team: iri.team.id } }))
      t.stagesMap.forEach(s => {
        let tabla = s.getTable('finished')
        console.table(tabla.map(tti => tti.getInterface()))
      })
      console.log('------------------------------------------------------------------------------')
    })

    // actualizacion de ranking
    federation.updateRankings()
  }

  const lsArr: LeagueSystem[] = []

  console.log(federation)
  console.log(federation.getRanking('S'))
  federationFileLS.forEach((value: TypeCategoryList<ILeagueSystemCreator>, key: number) => {
    const ls = new LeagueSystem(value['S']!)
    console.log(`---------------------\nyear: ${key}`)
    // console.log('getGenericRankOrdered')
    console.log(ls.getDivisionConfigList().map(v => v.fromGSGData.qualyRules))
    lsArr.push(ls)
  })

  console.log(`---------------------\n`)
  const prev: IDivisionCondition[] = [
    { N: 18, p: 0, r: 3 },
    { N: 18, p: 3, r: 3 },
    { N: 48, p: 3, r: 6 },
    { N: 50, p: 6, r: 0 },
  ];
  const next: IDivisionCondition[] = [
    { N: 20, p: 0, r: 3 },
    { N: 20, p: 3, r: 4 },
    { N: 40, p: 4, r: 6 },
    { N: 120, p: 6, r: 12 },
    { N: 250, p: 12, r: 0 },
    // { N: 250, p: 12, r: 0 },
  ];
  const transi = LeagueSystem.getLeagueSystemTransitionCondition(prev, next)

  console.log('prev', prev)
  console.log('transi', transi)
  console.log('next', next)

  // console.log(federation.getDivGenericRank('S', prev))
  console.log(federation.getDivGenericRank('S', lsArr[1].getDivisionConfigList().map(e => e.condition)))
}

/************************************************************************************************************ */
// año 1156 a 1160
const iniCreator_1156: TInitialCreator = {
  tournamentId: 'S_F014_D01',
  qualyrankList: [
    { origin: 'fr_S_F014', pos: 1 },
    { origin: 'fr_S_F014', pos: 2 },
    { origin: 'fr_S_F014', pos: 3 },
    { origin: 'fr_S_F014', pos: 4 },
    { origin: 'fr_S_F014', pos: 5 },
    { origin: 'fr_S_F014', pos: 6 },
    { origin: 'fr_S_F014', pos: 7 },
    { origin: 'fr_S_F014', pos: 8 },
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
  matchList: [28, 32, 36, 40, 44, 48, 52, 70, 74, 78, 82, 86, 90, 94, 98, 99, 100],
  schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
  qualyRules: [
    // { minRankPos: 1, maxRankPos: 1 }
  ]
}
federationFileLS.set(1156, {
  S: {
    category: 'S',
    isTransition: false,
    divisions: [{
      level: 1,
      fromGSGData: config_1156,
      condition: { N: 8, p: 0, r: 0 }
    }],
  }
})
/************************************************************************************************************ */
// año 1161
const iniCreator_1161: TInitialCreator = {
  tournamentId: 'S_F014_D01',
  qualyrankList: [
    { origin: 'fr_S_F014', pos: 1 },
    { origin: 'fr_S_F014', pos: 2 },
    { origin: 'fr_S_F014', pos: 3 },
    { origin: 'fr_S_F014', pos: 4 },
    { origin: 'fr_S_F014', pos: 5 },
    { origin: 'fr_S_F014', pos: 6 },
    { origin: 'fr_S_F014', pos: 7 },
    { origin: 'fr_S_F014', pos: 8 },
    { origin: 'fr_S_F014', pos: 9 },
    { origin: 'fr_S_F014', pos: 10 },
  ],
  rankGroupNumbers: [8, 2]
};

const phaseCreatorArr_1161: TPhaseCreator[] = [
  {
    id: 1,
    stages: [
      { count: 2, stage: { type: 'group', opt: 'h&a', value: 1 } }
    ]
  }
]

const config_1161: ITournamentFromGSGData = {
  name: 'Lig',
  gsgData: { initialCreator: iniCreator_1161, phaseArr: phaseCreatorArr_1161 },
  matchList: [28, 32, 36, 40, 44, 48, 52, 56, 60, 70, 74, 78, 82, 86, 90, 94, 98, 102],
  schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 62, 62, 62, 62, 62, 62, 62, 62, 62],
  qualyRules: [
    // { minRankPos: 1, maxRankPos: 1 },
    // { minRankPos: 9, maxRankPos: 10 },
  ]
};
// 2 div
const iniCreator_1161_2d: TInitialCreator = {
  tournamentId: 'S_F014_D02',
  qualyrankList: [
    { origin: 'fr_S_F014', pos: 11 },
    { origin: 'fr_S_F014', pos: 12 },
    { origin: 'fr_S_F014', pos: 13 },
    { origin: 'fr_S_F014', pos: 14 },
    { origin: 'fr_S_F014', pos: 15 },
    { origin: 'fr_S_F014', pos: 16 },
    { origin: 'fr_S_F014', pos: 17 },
    { origin: 'fr_S_F014', pos: 18 },
  ],
  rankGroupNumbers: [2, 6]
};

const phaseCreatorArr_1161_2d: TPhaseCreator[] = [
  {
    id: 1,
    stages: [
      { count: 2, stage: { type: 'group', opt: 'h&a', value: 1 } }
    ]
  },
  {
    id: 2,
    stages: [
      { count: 1, stage: { type: 'transfer' } },
      {
        count: 2, stage: {
          type: 'playoff', opt: 'neutral', value: 1, draw: {
            interv: 14, rules: [{
              origin: 'FGF', minCount: 1
            }]
          }
        }
      },
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
    // { minRankPos: 1, maxRankPos: 1 },
    // { minRankPos: 1, maxRankPos: 2 },
  ]
}
const transi = LeagueSystem.getLeagueSystemTransitionCondition(
  [
    { N: 8, p: 0, r: 0 }
  ],
  [
    { N: 10, p: 0, r: 2 },
    { N: 8, p: 2, r: 0 }
  ])

federationFileLS.set(1161, {
  S: {
    category: 'S',
    isTransition: false,
    divisions: [{
      level: 1,
      fromGSGData: config_1161,
      condition: { N: 10, p: 0, r: 2 }
    }, {
      level: 2,
      fromGSGData: config_1161_2d,
      condition: { N: 8, p: 2, r: 0 }
    }],
  }
})
// esto se debe hacer antes/agregar antes
federationFileLS.set(1160, {
  S: {
    category: 'S',
    isTransition: true,
    divisions: [{
      level: 1,
      fromGSGData: config_1156,
      condition: transi[0]
    }],
  }
})
federationFileLS.forEach((list: TypeCategoryList<ILeagueSystemCreator>) => {
  CATEGORIES.forEach((c: TypeCategory) => {
    const ilsc = list[c]
    if (ilsc) {
      new LeagueSystem(ilsc)
    }
  })
})