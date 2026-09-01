import { describe, it, expect } from "vitest";
import { JDate } from "jl-calendar";
import { Country, Town } from "..";
import { Federation, IFederationCreator } from "../Federation";
import { Institution, IInstitutionCreator } from "../Institution";
import LeagueSystem, { ILeagueSystemCreator } from "../LeagueSystem";
import { Confederation, IConfederationCreator } from "../Confederation";
import { Continent } from "../GeogEntity";
import { TInitialCreator, TPhaseCreator } from "../../../GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData } from "../../../GeneralStageGraph/tournamentFromGSG";

// -----------------------------------------------------------------------------
// Capa 6 — Entidades (Institution / Federation / LeagueSystem / Confederation)
//
// Se testean los métodos deterministas (sin simulación ni store): construcción,
// altas con validación de duplicados, rankings de federación, división del rank, y
// los cálculos de LeagueSystem.
// -----------------------------------------------------------------------------

const CATEGORY = 'S' as const;

function country() {
  return new Country({ i: 'C_T', n: 'Country', r: '1', a: 100, p: 1000 });
}
function town(id: string) {
  return new Town({ i: id, n: id, c: 'C_T', a: 10, p: 100 });
}

function makeInstitution(id: string): Institution {
  const iic: IInstitutionCreator = {
    id, name: id, shortName: id, abrevName: id,
    headquarters: town(`T_${id}`),
    funtationDay: new JDate(13556),
  };
  return new Institution(iic);
}

function makeFederation(id = 'FED'): Federation {
  const creator: IFederationCreator = {
    id,
    areaAsosiated: country(),
    name: id, shortName: id,
    fundationDay: new JDate(378 * 1888),
    members: new Map<string, Institution>(),
    founderMembers: [],
    headquarters: town('T_FED'),
    cupSystem: {}, leagueSystem: {}, rankings: {},
  };
  return new Federation(creator);
}

/** Federación con N instituciones, cada una con team en la categoría, en el ranking. */
function federationWithTeams(n: number, id = 'FED'): Federation {
  const fed = makeFederation(id);
  for (let i = 1; i <= n; i++) {
    const inst = makeInstitution(`I${String(i).padStart(3, '0')}`);
    fed.addMember(inst);
    inst.createTeam(CATEGORY);
    fed.addInstitutionToCategory(inst, CATEGORY);
  }
  return fed;
}

/** Config de liga de N equipos (para LeagueSystem, que valida el GSG al construir). */
function ligaConfig(n: number, tournamentId = 'S_FED_D01'): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId,
    qualyrankList: Array.from({ length: n }, (_, i) => ({ origin: 'fr_S_FED', pos: i + 1 })),
    rankGroupNumbers: [n],
  };
  const phaseArr: TPhaseCreator[] = [
    { id: 1, stages: [{ count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }] },
  ];
  // fechas: liga de 8 h&a = 14 turnos
  return {
    name: tournamentId,
    gsgData: { initialCreator: iniCreator, phaseArr },
    matchList: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    schedList: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    qualyRules: [],
  };
}

// -----------------------------------------------------------------------------
// Institution
// -----------------------------------------------------------------------------
describe("Institution", () => {
  it("createTeam crea un team por categoría; getTeam lo devuelve", () => {
    const inst = makeInstitution('I1');
    expect(inst.getTeam(CATEGORY)).toBeUndefined();
    inst.createTeam(CATEGORY);
    const team = inst.getTeam(CATEGORY);
    expect(team).toBeDefined();
    expect(team!.id).toBe('S_I1'); // <category>_<entity.id>
  });

  it("createTeam lanza si ya existe team en esa categoría", () => {
    const inst = makeInstitution('I1');
    inst.createTeam(CATEGORY);
    expect(() => inst.createTeam(CATEGORY)).toThrow(/ya cuenta con un team/);
  });
});

// -----------------------------------------------------------------------------
// Federation - membresía y ranking
// -----------------------------------------------------------------------------
describe("Federation - addMember / addInstitutionToCategory", () => {
  it("addMember agrega y rechaza duplicados por id", () => {
    const fed = makeFederation();
    const inst = makeInstitution('I1');
    fed.addMember(inst);
    expect(fed.members.has('I1')).toBe(true);
    expect(() => fed.addMember(makeInstitution('I1'))).toThrow();
  });

  it("addInstitutionToCategory lanza si la institución no tiene team en la categoría", () => {
    const fed = makeFederation();
    const inst = makeInstitution('I1');
    fed.addMember(inst);
    // sin createTeam
    expect(() => fed.addInstitutionToCategory(inst, CATEGORY)).toThrow();
  });

  it("addInstitutionToCategory rechaza el mismo team dos veces", () => {
    const fed = makeFederation();
    const inst = makeInstitution('I1');
    fed.addMember(inst);
    inst.createTeam(CATEGORY);
    fed.addInstitutionToCategory(inst, CATEGORY);
    expect(() => fed.addInstitutionToCategory(inst, CATEGORY)).toThrow();
  });
});

describe("Federation - getRanking", () => {
  it("context fr_<cat>_<id>, metadata de federación y size = nº de teams", () => {
    const fed = federationWithTeams(8);
    const ranking = fed.getRanking(CATEGORY);
    expect(ranking.context).toBe('fr_S_FED');
    expect(ranking.size).toBe(8);
    expect(ranking.metadata?.generatedBy).toBe('federation');
  });
});

describe("Federation - getDivGenericRank", () => {
  it("divide el ranking en cortes consecutivos según N", () => {
    const fed = federationWithTeams(8);
    const divs = fed.getDivGenericRank(CATEGORY, [
      { N: 4, p: 0, r: 0 },
      { N: 4, p: 0, r: 0 },
    ]);
    expect(divs.length).toBe(2);
    expect(divs[0].length).toBe(4);
    expect(divs[1].length).toBe(4);
  });

  it("lanza si la suma de N no coincide con la cantidad de teams", () => {
    const fed = federationWithTeams(8);
    expect(() => fed.getDivGenericRank(CATEGORY, [{ N: 4, p: 0, r: 0 }, { N: 3, p: 0, r: 0 }])).toThrow();
  });
});

describe("Federation - createTournamentList", () => {
  it("sin leagueSystem configurado devuelve lista vacía", () => {
    const fed = federationWithTeams(8);
    expect(fed.createTournamentList()).toEqual([]);
  });

  it("con un leagueSystem de 1 división devuelve 1 torneo", () => {
    const fed = federationWithTeams(8);
    const ls = new LeagueSystem({
      category: CATEGORY, isTransition: false,
      divisions: [{ level: 1, fromGSGData: ligaConfig(8), condition: { N: 8, p: 0, r: 0 } }],
    });
    fed.updateLeagueSystem(ls);
    const list = fed.createTournamentList();
    expect(list.length).toBe(1);
  });
});

// -----------------------------------------------------------------------------
// LeagueSystem
// -----------------------------------------------------------------------------
describe("LeagueSystem", () => {
  function ls(): LeagueSystem {
    return new LeagueSystem({
      category: CATEGORY, isTransition: false,
      divisions: [{ level: 1, fromGSGData: ligaConfig(8), condition: { N: 8, p: 0, r: 0 } }],
    });
  }

  it("getTeamsCount suma los N de las divisiones", () => {
    expect(ls().getTeamsCount()).toBe(8);
  });

  it("category y getDivisionConfigList exponen la config", () => {
    const l = ls();
    expect(l.category).toBe(CATEGORY);
    expect(l.getDivisionConfigList().length).toBe(1);
  });

  it("getGenericRankOrdered concatena los qualyRankList de las divisiones", () => {
    expect(ls().getGenericRankOrdered().length).toBe(8);
  });
});

// -----------------------------------------------------------------------------
// Confederation
// -----------------------------------------------------------------------------
describe("Confederation", () => {
  function makeConfederation(): Confederation {
    const creator: IConfederationCreator = {
      id: 'CONF',
      areaAsosiated: new Continent({ i: 'CONT', n: 'Cont', a: 1000, p: 10000 }),
      name: 'Conf', shortName: 'CONF',
      fundationDay: new JDate(100),
      members: new Map<string, Federation>(),
      founderMembers: [],
      headquarters: town('T_CONF'),
    };
    return new Confederation(creator);
  }

  it("addMember agrega federaciones y rechaza duplicados", () => {
    const conf = makeConfederation();
    const fed = makeFederation('FA');
    conf.addMember(fed);
    expect(conf.members.has('FA')).toBe(true);
    expect(() => conf.addMember(makeFederation('FA'))).toThrow();
  });

  it("members refleja las federaciones agregadas", () => {
    const conf = makeConfederation();
    conf.addMember(makeFederation('FA'));
    conf.addMember(makeFederation('FB'));
    expect([...conf.members.keys()].sort()).toEqual(['FA', 'FB']);
  });
});
