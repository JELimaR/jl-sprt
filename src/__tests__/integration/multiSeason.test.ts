import { describe, it, expect, beforeEach } from "vitest";
import { JCalendar, JDateTime, JDate } from "jl-calendar";
import { Federation, IFederationCreator, Country, Town } from "../../JSportModule";
import { IInstitutionCreator, Institution } from "../../JSportModule/data/Entities/Institution";
import LeagueSystem, { ILeagueSystemCreator } from "../../JSportModule/data/Entities/LeagueSystem";
import { TInitialCreator, TPhaseCreator } from "../../JSportModule/GeneralStageGraph/GSGCreators";
import { ITournamentFromGSGData } from "../../JSportModule/GeneralStageGraph/tournamentFromGSG";
import { FootballProfile } from "../../JSportModule/profiles/football/FootballProfile";
import { teamsAssign } from "../../Tournament/teamsAssign";
import { SimulationContext } from "../../Tournament/SimulationContext";
import Tournament from "../../Tournament/Tournament";
import { reseedRandom } from "../../JSportModule/Match/randomSource";

// -----------------------------------------------------------------------------
// Capa 7 — Integración multi-temporada (ascensos y descensos)
//
// Construye una federación con dos divisiones (D01 y D02) de 8 equipos cada una,
// corre una temporada completa de ambas divisiones y aplica
// Federation.updateRankings(store) para verificar que:
//   - el último de D01 (descenso, r=1) baja a D02
//   - el primero de D02 (ascenso, p=1) sube a D01
//   - el resto de los equipos conserva su bloque de división
//   - no se pierden ni se duplican equipos entre temporadas
//
// Determinista: reseedRandom(SEED) antes de cada corrida. El store es local al
// contexto (ctx.store), sin estado global compartido.
// -----------------------------------------------------------------------------

const SEED = 13;
const SEASON = 1156;
const FED_ID = 'MSFED';
const DIV_SIZE = 8;
const TOTAL = DIV_SIZE * 2;

/**
 * Config de una división de 8 equipos, ida y vuelta (mismo esquema que
 * season.test.ts, verificado). `posOffset` corre las posiciones del ranking
 * inicial para que D02 tome las posiciones 9..16 de la federación.
 */
function divisionConfig(tournamentId: string, posOffset: number): ITournamentFromGSGData {
  const iniCreator: TInitialCreator = {
    tournamentId,
    qualyrankList: Array.from({ length: DIV_SIZE }, (_, i) => ({
      origin: `fr_S_${FED_ID}`,
      pos: posOffset + i + 1,
    })),
    rankGroupNumbers: [DIV_SIZE],
  };
  const phaseCreatorArr: TPhaseCreator[] = [
    {
      id: 1,
      stages: [{ count: 1, stage: { type: 'group', opt: 'h&a', value: 1 } }],
    },
  ];
  return {
    name: 'Lig',
    gsgData: { initialCreator: iniCreator, phaseArr: phaseCreatorArr },
    matchList: [28, 32, 36, 40, 44, 48, 52, 70, 74, 78, 82, 86, 90, 94],
    schedList: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
    qualyRules: [],
  };
}

function buildFederationWithTeams(): Federation {
  const fedCreator: IFederationCreator = {
    id: FED_ID,
    areaAsosiated: new Country({ i: 'C_TEST', n: 'Country_TEST', r: '1', a: 18141, p: 1576000 }),
    name: 'Federation MultiSeason', shortName: FED_ID,
    fundationDay: new JDate(378 * 1888),
    members: new Map<string, Institution>(),
    founderMembers: [],
    headquarters: new Town({ i: 'T_TEST', n: 'Town_TEST', c: '12', a: 18, p: 15400 }),
    cupSystem: {}, leagueSystem: {}, rankings: {},
  };
  const federation = new Federation(fedCreator);
  for (let i = 1; i <= TOTAL; i++) {
    const iid = `C_TEST_I${String(i).padStart(3, '0')}`;
    const iic: IInstitutionCreator = {
      id: iid, name: iid, shortName: iid, abrevName: iid,
      headquarters: new Town({ i: `T_${iid}`, n: iid, c: 'C_TEST', p: 2, a: 5 }),
      funtationDay: new JDate(13556),
    };
    const institution = new Institution(iic);
    federation.addMember(institution);
    institution.createTeam('S');
    federation.addInstitutionToCategory(institution, 'S');
  }
  return federation;
}

/** Sistema de dos divisiones: D01 (r=1, sin ascensos) y D02 (p=1, sin descensos). */
function twoDivisionLeagueSystem(): LeagueSystem {
  const lsc: ILeagueSystemCreator = {
    category: 'S',
    isTransition: false,
    divisions: [
      { level: 1, fromGSGData: divisionConfig('S_' + FED_ID + '_D01', 0), condition: { N: DIV_SIZE, p: 0, r: 1 } },
      { level: 2, fromGSGData: divisionConfig('S_' + FED_ID + '_D02', DIV_SIZE), condition: { N: DIV_SIZE, p: 1, r: 0 } },
    ],
  };
  return new LeagueSystem(lsc);
}

/** Avanza el calendario ejecutando todos los eventos. */
function advanceCalendar(cal: JCalendar): void {
  let guard = 0;
  while (cal.getNextEvents().events.length !== 0) {
    const { dt, events } = cal.getNextEvents();
    cal.now = dt;
    events.forEach((eve) => eve.execute());
    if (++guard > 100000) throw new Error('advanceCalendar: demasiados eventos (posible loop)');
  }
}

/**
 * Corre una temporada completa de ambas divisiones sobre la federación dada.
 * Escribe los `tr_` de cada división en el store (Tournament.getRelativeRank no
 * lo hace por sí solo) y devuelve, por división, la lista ordenada de entity ids.
 */
function runSeason(federation: Federation): { d01: string[]; d02: string[] } {
  reseedRandom(SEED);
  const franking = federation.getRanking('S');
  const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON, 168).getIJDateTimeCreator());
  const ctx = new SimulationContext(cal);
  ctx.store.set(franking.context, franking);

  federation.updateLeagueSystem(twoDivisionLeagueSystem());

  const tournamentData = federation.createTournamentList();
  expect(tournamentData.length).toBe(2);

  // Crear y asignar AMBAS divisiones ANTES de avanzar el calendario. Las dos
  // usan las mismas half-weeks de la temporada; si se avanzara el calendario
  // tras crear la primera, los eventos de la segunda quedarian en el pasado.
  const tournaments = tournamentData.map((data) => {
    const t = Tournament.create({ id: data.name, season: SEASON }, data, ctx, new FootballProfile());
    teamsAssign(t, ctx);
    return t;
  });

  // avanzar una sola vez -> se juegan todos los partidos de ambas divisiones
  advanceCalendar(cal);

  const result: { d01: string[]; d02: string[] } = { d01: [], d02: [] };
  tournaments.forEach((t) => {
    const trank = t.getRelativeRank();
    // Tournament no persiste su tr_ automaticamente: lo hacemos para que
    // Federation.updateRankings pueda leerlo desde el store.
    ctx.store.set(trank.context, trank);
    const ids = trank.getRankTable().map((r) => r.team.entity.id);
    if (trank.context.endsWith('D01')) result.d01 = ids;
    else result.d02 = ids;
  });

  federation.updateRankings(ctx.store);
  return result;
}

describe("Integración - multi-temporada con ascensos y descensos", () => {
  beforeEach(() => {
    reseedRandom(SEED);
  });

  it("aplica ascensos y descensos entre temporadas sin perder ni duplicar equipos", () => {
    const federation = buildFederationWithTeams();

    const rankBefore = federation.getRanking('S').getRankTable().map((r) => r.team.entity.id);
    expect(rankBefore.length).toBe(TOTAL);

    const season1 = runSeason(federation);
    expect(season1.d01.length).toBe(DIV_SIZE);
    expect(season1.d02.length).toBe(DIV_SIZE);

    const rankAfter = federation.getRanking('S').getRankTable().map((r) => r.team.entity.id);

    // el conjunto de equipos se conserva (no se pierde ni se duplica nadie)
    expect(rankAfter.length).toBe(TOTAL);
    expect(new Set(rankAfter).size).toBe(TOTAL);
    expect([...rankAfter].sort()).toEqual([...rankBefore].sort());

    // el ultimo de D01 (descenso) queda en el bloque de D02 (posiciones 9..16)
    const relegated = season1.d01[DIV_SIZE - 1];
    expect(rankAfter.slice(DIV_SIZE)).toContain(relegated);

    // el primero de D02 (ascenso) queda en el bloque de D01 (posiciones 1..8)
    const promoted = season1.d02[0];
    expect(rankAfter.slice(0, DIV_SIZE)).toContain(promoted);
  });

  it("es determinista: dos federaciones identicas producen los mismos rankings", () => {
    const fedA = buildFederationWithTeams();
    const fedB = buildFederationWithTeams();

    const a = runSeason(fedA);
    const b = runSeason(fedB);

    expect(a.d01).toEqual(b.d01);
    expect(a.d02).toEqual(b.d02);

    const afterA = fedA.getRanking('S').getRankTable().map((r) => r.team.entity.id);
    const afterB = fedB.getRanking('S').getRankTable().map((r) => r.team.entity.id);
    expect(afterA).toEqual(afterB);
  });

  it("updateRankings lanza si falta el tr_ de una division (temporada no terminada)", () => {
    const federation = buildFederationWithTeams();
    const franking = federation.getRanking('S');
    const cal = new JCalendar(JDateTime.createFromDayOfYearAndYear(1, SEASON, 168).getIJDateTimeCreator());
    const ctx = new SimulationContext(cal);
    ctx.store.set(franking.context, franking);
    federation.updateLeagueSystem(twoDivisionLeagueSystem());

    // sin correr ningun torneo, el store no tiene los tr_ -> debe lanzar
    expect(() => federation.updateRankings(ctx.store)).toThrow();
  });
});
